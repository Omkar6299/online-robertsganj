import { Student, User, AcademicYear, Course, Semester, StudentAdmissionFeeDetail, StudentFeeDetail, Payment } from '../../models/index.js';
import { sequelize } from '../../config/database.js';
import PaymentService from '../../utils/services/PaymentService.js';
import FeeService from '../../utils/services/FeeService.js';
import siteconfig from '../../config/siteconfig.js';
import { handleError, flashErrorAndRedirect, flashSuccessAndRedirect } from '../../utils/responseHelper.js';

export const initiatePayment = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const userId = req.session.admission_user_id;
        const requestedSemesterId = req.query.semester_id;
        const activeYear = await AcademicYear.findOne({ where: { status: 'Active' }, transaction: t });

        if (!activeYear) {
            await t.rollback();
            return flashErrorAndRedirect(req, res, 'No active academic year found.', '/student/dashboard');
        }

        const student = await Student.findOne({
            where: {
                user_id: String(userId),
                academic_year: String(activeYear.id)
            },
            include: [
                { model: User, as: 'user' },
                { model: Semester, as: 'semsterName' }
            ],
            transaction: t
        });

        if (!student) {
            await t.rollback();
            return flashErrorAndRedirect(req, res, 'Student record not found.', '/student/dashboard');
        }

        // SECURITY CHECK: No payment allowed before final submission in ANY case
        if (student.declaration_status !== '1') {
            await t.rollback();
            return flashErrorAndRedirect(req, res, 'Please submit your application form first before making payment.', '/student/dashboard');
        }

        // Determine which semester we are paying for
        const targetSemesterId = requestedSemesterId || student.year;
        const targetSem = await Semester.findByPk(targetSemesterId, { transaction: t });

        // SECURITY CHECK: If approval is required, check admission status
        if (targetSem && targetSem.approval_required !== 0 && student.admission_status !== 'Approved') {
            await t.rollback();
            return flashErrorAndRedirect(req, res, 'Your admission is not yet approved by the administrator.', '/student/dashboard');
        }

        // Check if already paid for THIS semester using the verified table
        const existingPayment = await StudentAdmissionFeeDetail.findOne({
            where: {
                user_id: String(userId),
                semester_id: String(targetSemesterId),
                status: 'Success'
            },
            transaction: t
        });

        if (existingPayment) {
            await t.rollback();
            return flashErrorAndRedirect(req, res, 'Fee for this semester has already been paid successfully.', '/student/dashboard');
        }

        // DYNAMIC FEE CALCULATION
        let feeAmount = 0;
        try {
            console.log('Initiating fee calculation for student:', student.id, 'Session:', activeYear.id, 'Metadata:', {
                course: student.course_id,
                category: student.category,
                gender: student.gender,
                sem: targetSemesterId
            });
            feeAmount = await FeeService.getCalculatedFee(student, targetSemesterId);
        } catch (feeError) {
            console.error('Fee Calculation Error for Student ID:', student.id, 'Error:', feeError.message);
            await t.rollback();
            return flashErrorAndRedirect(req, res, feeError.message || 'Could not calculate your admission fee. Please contact administrator.', '/student/dashboard');
        }

        // Generate unique 10-digit numeric admission transaction ID
        const minTxn = 1000000000;
        const maxTxn = 9999999999;
        const randomTxnId = Math.floor(Math.random() * (maxTxn - minTxn + 1)) + minTxn;
        const admissionTxnId = String(randomTxnId);

        // LOG ALL PAYMENT DATA IN student_fees_details (StudentFeeDetail model)
        const semesterType = (targetSem && parseInt(targetSem.order) % 2 === 0) ? 'Even' : 'Odd';

        await StudentFeeDetail.create({
            user_id: String(userId),
            course_id: String(student.course_id),
            semester_id: String(targetSemesterId),
            semester_type: semesterType,
            challan_id: '',
            academic_year: String(activeYear.id),
            amount: String(feeAmount),
            payment_mode: '',
            payment_method: 'atom',
            status: 'initiated',
            transaction_date: new Date().toISOString(),
            txnInitDate: new Date().toISOString(),
            txnCompleteDate: '',
            payment_transaction_id: admissionTxnId,
            bank_transaction_id: '',
            merchant_txn_id: admissionTxnId,
            atom_txn_id: '',
            remark: `Fee payment initiated for Semester ${targetSemesterId}`
        }, { transaction: t });


        await t.commit();

        const environment = res.locals.siteSettings?.atom_environment || siteconfig.atom_environment || 'demo';
        const regProductId = res.locals.siteSettings?.atom_reg_product_id || siteconfig.atom_registration_product_id || 'SONEBHADRA';
        const admProductId = res.locals.siteSettings?.atom_adm_product_id || siteconfig.atom_admission_product_id || 'EXAM_FEE';

        // Select Product ID based on semester type: Odd -> Registration ID, Even -> Admission ID
        let targetProductId = (semesterType === 'Even') ? admProductId : regProductId;

        // Atom Demo environment only supports 'AIPAY' product ID
        if (environment === 'demo') {
            targetProductId = 'AIPAY';
        }

        // Prepare payment data for Atom
        const paymentData = PaymentService.preparePaymentData({
            transactionId: admissionTxnId,
            amount: feeAmount,
            email: student.user.email,
            mobile: student.user.phone,
            returnUrl: `${req.protocol}://${req.get('host')}/student/admission_payment_response`,
            environment: environment,
            prodId: targetProductId,
            udf1: student.registration_no || '',                 // Registration No
            udf2: admissionTxnId,                                 // Merchant Transaction ID
            udf3: String(student.id) || '',                       // Student ID
            udf4: String(student.user_id) || '',                  // User ID
            udf5: student.user.phone || ''                        // Mobile Number
        });

        // Get Atom Token
        const atomTokenId = await PaymentService.createTokenId(paymentData);

        if (!atomTokenId) {
            return flashErrorAndRedirect(req, res, 'Failed to initiate payment gateway. Please try again later.', '/student/dashboard');
        }

        // Render payment initiation page (which redirects to Atom)
        res.render('frontend/payment/payment_initiate', {
            atomTokenId,
            merchId: paymentData.login,
            payUrl: paymentData.paymentPageUrl,
            data: paymentData,
            atomEnvironment: environment
        });

    } catch (error) {
        if (t) await t.rollback();
        handleError(req, res, error, 'An error occurred while initiating admission fee payment.', '/student/dashboard');
    }
};

export const paymentResponse = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const encData = req.body.encData || req.body.encResp || req.query.encData || req.query.encResp;

        if (!encData) {
            await t.rollback();
            return flashErrorAndRedirect(req, res, 'Invalid payment response received.', '/student/dashboard');
        }

        const parsedResponse = PaymentService.parsePaymentResponse(encData);

        if (!parsedResponse) {
            await t.rollback();
            return flashErrorAndRedirect(req, res, 'Failed to process payment response.', '/student/dashboard');
        }

        const admissionTxnId = parsedResponse.transactionId;
        
        // Find record in student_fees_details
        const feeLog = await StudentFeeDetail.findOne({
            where: { payment_transaction_id: admissionTxnId },
            transaction: t
        });

        // Find record in general Payment table
        const paymentRecord = await Payment.findOne({
            where: { merchant_txn_id: admissionTxnId },
            transaction: t
        });

        if (!feeLog && !paymentRecord) {
            await t.rollback();
            return flashErrorAndRedirect(req, res, 'Payment record not found.', '/student/dashboard');
        }

        const isSuccess = parsedResponse.success;
        const finalStatus = isSuccess ? 'Success' : 'Failed';

        // Update student_fees_details (StudentFeeDetail)
        if (feeLog) {
            await feeLog.update({
                status: finalStatus,
                bank_transaction_id: parsedResponse.bankTxnId,
                atom_txn_id: parsedResponse.atomTxnId,
                txnCompleteDate: parsedResponse.txnCompleteDate,
                transaction_date: parsedResponse.txnCompleteDate,
                remark: isSuccess ? 'Payment Successful' : `Payment Failed: ${parsedResponse.message}`
            }, { transaction: t });
        }

        // Update general Payment table
        if (paymentRecord) {
            await paymentRecord.update({
                status: finalStatus,
                bank_transaction_id: parsedResponse.bankTxnId,
                atom_txn_id: parsedResponse.atomTxnId,
                txnCompleteDate: parsedResponse.txnCompleteDate,
                transaction_date: parsedResponse.txnCompleteDate
            }, { transaction: t });
        }

        // IF SUCCESS: Copy to verified student_admission_fee_details (StudentAdmissionFeeDetail)
        if (isSuccess) {
            // Fetch student/semester data from the parsed response UDFs or the existing log
            const studentId = parsedResponse.student_id || (feeLog ? feeLog.student_id : null);
            const registrationNo = parsedResponse.registration_no || (feeLog ? feeLog.registration_no : null);
            const userId = parsedResponse.user_id || (feeLog ? feeLog.user_id : null);
            const semesterId = feeLog ? feeLog.semester_id : (parsedResponse.rawResponse?.payInstrument?.extras?.udf2 || null); // Note: udf2 is txnId but we check feeLog first
            const academicYearId = feeLog ? feeLog.academic_year : null;

            // Fetch semester to get order for type categorization
            const confirmedSem = await Semester.findByPk(semesterId, { transaction: t });
            const confirmedSemesterType = (confirmedSem && parseInt(confirmedSem.order) % 2 === 0) ? 'Even' : 'Odd';

            await StudentAdmissionFeeDetail.create({
                user_id: String(userId || ''),
                student_id: studentId,
                registration_no: registrationNo,
                academic_year: String(academicYearId || ''),
                semester_id: String(semesterId || ''),
                semester_type: confirmedSemesterType,
                amount: feeLog ? feeLog.amount : parsedResponse.amount,
                merchant_txn_id: admissionTxnId,
                bank_transaction_id: parsedResponse.bankTxnId,
                atom_txn_id: parsedResponse.atomTxnId,
                status: 'Success'
            }, { transaction: t });
        }

        await t.commit();

        if (isSuccess) {
            // RESTORE SESSION: If session was lost due to cross-site POST (SameSite issue),
            // we backfill it using the user_id returned by the gateway.
            if (!req.session.admission_user_id) {
                const userId = parsedResponse.user_id || (feeLog ? feeLog.user_id : null);
                if (userId) {
                    const user = await User.findByPk(userId);
                    if (user) {
                        req.session.admission_user_id = user.id;
                        req.session.admission_name = user.name;
                        
                        // Also restore student ID if possible
                        const student = await Student.findOne({ where: { user_id: String(user.id) }, order: [['id', 'DESC']] });
                        if (student) {
                            req.session.admission_student_id = student.id;
                            req.session.admission_registration_no = student.registration_no;
                        }
                        
                        console.log('Session restored after admission payment for User ID:', user.id);
                    }
                }
            }
            
            // Save session before redirecting to avoid race conditions
            return req.session.save((err) => {
                if (err) console.error('Session save error during admission payment response:', err);
                flashSuccessAndRedirect(req, res, 'Admission fee paid successfully!', `/student/admission_receipt?txn_id=${admissionTxnId}`);
            });
        } else {
            return flashErrorAndRedirect(req, res, `Payment failed: ${parsedResponse.message}`, '/student/dashboard');
        }

    } catch (error) {
        if (t) await t.rollback();
        handleError(req, res, error, 'An error occurred while processing payment response.', '/student/dashboard');
    }
};

export const generateReceipt = async (req, res) => {
    try {
        const { txn_id } = req.query;
        const userId = req.session.admission_user_id;

        const payment = await StudentAdmissionFeeDetail.findOne({
            where: {
                merchant_txn_id: txn_id,
                user_id: String(userId),
                status: 'Success'
            },
            include: [
                { 
                    model: Student, 
                    as: 'student', 
                    include: [
                        { model: Course, as: 'courseName' }, 
                        { model: Semester, as: 'semsterName' }
                    ] 
                },
                { model: User, as: 'user' },
                { model: Semester, as: 'semester' }
            ]
        });

        if (!payment) {
            return flashErrorAndRedirect(req, res, 'Receipt not found or payment not successful.', '/student/dashboard');
        }

        const activeYear = await AcademicYear.findByPk(payment.academic_year);

        res.render('student_panel/admission/admission_fee_receipt', {
            title: 'Admission Fee Receipt',
            payment,
            student: payment.student,
            user: payment.user,
            activeYear,
            layout: 'student'
        });

    } catch (error) {
        handleError(req, res, error, 'An error occurred while generating receipt.', '/student/dashboard');
    }
};
