import { 
    Payment, 
    Student, 
    User, 
    AcademicYear, 
    Course, 
    Semester, 
    StudentAdmissionFeeDetail, 
    StudentFeeDetail 
} from '../../models/index.js';
import { sequelize } from '../../config/database.js';
import PaymentService from '../../utils/services/PaymentService.js';
import { handleError } from '../../utils/responseHelper.js';

/**
 * Render the Payment Sync View
 */
export const syncView = async (req, res) => {
    try {
        const courses = await Course.findAll({ order: [['name', 'ASC']] });
        const academicYears = await AcademicYear.findAll({ order: [['id', 'DESC']] });

        res.render('admin_panel/payments/sync', {
            title: 'Payment Transaction Sync',
            courses,
            academicYears,
            results: null,
            error: null
        });
    } catch (error) {
        handleError(req, res, error, 'Failed to load sync view', '/admin/dashboard');
    }
};

/**
 * Synchronize Transaction Status with Atom Gateway or Manual Seed
 */
export const syncTransactionStatus = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        let { 
            merchTxnId, 
            rrn,
            atom_txn_id, // New field for manual mode
            txnDate,
            txnAmount,
            sync_mode,   // gateway or manual
            force_user_id, 
            force_fee_type, 
            force_academic_year, 
            force_course_id, 
            force_semester_id 
        } = req.body;

        const logs = [];

        // LOCAL LOOKUP BY RRN: If RRN is provided but no merchTxnId, try to find it locally
        if (rrn && !merchTxnId) {
            const localPayment = await Payment.findOne({ where: { bank_transaction_id: rrn }, transaction: t });
            const localFee = await StudentFeeDetail.findOne({ where: { bank_transaction_id: rrn }, transaction: t });
            
            if (localPayment) merchTxnId = localPayment.merchant_txn_id;
            else if (localFee) merchTxnId = localFee.merchant_txn_id;
        }

        if (!merchTxnId) {
            await t.rollback();
            return res.render('admin_panel/payments/sync', {
                title: 'Payment Transaction Sync',
                courses: await Course.findAll(),
                academicYears: await AcademicYear.findAll(),
                results: null,
                error: rrn ? `Transaction with RRN ${rrn} not found in local database. Please provide the Merchant Transaction ID to query the gateway.` : 'Merchant Transaction ID is required'
            });
        }

        const environment = res.locals.siteSettings?.atom_environment || 'demo';
        let atomResponse = null;

        if (sync_mode === 'manual') {
            // DIRECT SEED via Stored Procedure: Trust admin input and use DB-level logic
            
            // Try to get student details from payload if missing in students table
            let reg_no = null, course_type_id = null, father_name = null, mother_name = null, dob = null;
            
            const existingStudent = await Student.findOne({ where: { user_id: force_user_id, academic_year: force_academic_year }, transaction: t });
            if (!existingStudent) {
                const paymentRecord = await Payment.findOne({ where: { merchant_txn_id: merchTxnId }, transaction: t });
                if (paymentRecord && paymentRecord.payment_payload) {
                    try {
                        const payload = JSON.parse(paymentRecord.payment_payload);
                        reg_no = payload.registration_no;
                        course_type_id = payload.course_type_id;
                        father_name = payload.father_name;
                        mother_name = payload.mother_name;
                        dob = payload.dob;
                    } catch (e) { console.error('Payload parse error:', e); }
                }
            }

            const procedureParams = [
                force_user_id,
                merchTxnId,
                atom_txn_id || `MAN-${Date.now()}`,
                rrn || '',
                parseFloat(txnAmount),
                txnDate + ' 00:00:00',
                force_academic_year,
                force_course_id,
                force_semester_id,
                force_fee_type,
                // Additional student profile params
                reg_no,
                course_type_id,
                father_name,
                mother_name,
                dob
            ];

            await sequelize.query(
                'CALL sp_manual_seed_payment(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                { replacements: procedureParams, transaction: t }
            );

            atomResponse = {
                success: true,
                statusCode: 'MANUAL_SEED',
                message: 'Manually Seeded via Stored Procedure',
                transactionId: merchTxnId,
                atomTxnId: procedureParams[2],
                bankTxnId: rrn || '',
                amount: txnAmount,
                txnCompleteDate: txnDate + ' 00:00:00',
                user_id: force_user_id
            };
            logs.push('Payment reconciled successfully via Stored Procedure `sp_manual_seed_payment`');
            if (reg_no && !existingStudent) logs.push(`Created missing Student record for Reg No: ${reg_no}`);
        } else {
            // GATEWAY SYNC: Query the Atom API
            atomResponse = await PaymentService.queryTransactionStatus(merchTxnId, environment, txnDate, txnAmount);
            
            if (!atomResponse) {
                await t.rollback();
                return res.render('admin_panel/payments/sync', {
                    title: 'Payment Transaction Sync',
                    courses: await Course.findAll(),
                    academicYears: await AcademicYear.findAll(),
                    results: null,
                    error: 'Transaction not found in Atom Gateway or API error'
                });
            }

            const isSuccess = atomResponse.success;
            const finalStatus = isSuccess ? 'Success' : 'Failed';

            // 1. Check local database for existing records
            let paymentRecord = await Payment.findOne({ where: { merchant_txn_id: merchTxnId }, transaction: t });
            let feeLog = await StudentFeeDetail.findOne({ where: { merchant_txn_id: merchTxnId }, transaction: t });

            // Identify effective student/user data
            const userId = force_user_id || atomResponse.user_id || (paymentRecord ? paymentRecord.user_id : (feeLog ? feeLog.user_id : null));
            const feeType = force_fee_type || (paymentRecord ? paymentRecord.fee_type : (merchTxnId.startsWith('ADM') ? 'admission_fee' : 'form_fee'));
            const academicYearId = force_academic_year || (paymentRecord ? paymentRecord.academic_year : (feeLog ? feeLog.academic_year : null));
            const courseId = force_course_id || (feeLog ? feeLog.course_id : null);
            const semesterId = force_semester_id || (feeLog ? feeLog.semester_id : null);

            if (!userId && isSuccess) {
                await t.rollback();
                return res.render('admin_panel/payments/sync', {
                    title: 'Payment Transaction Sync',
                    courses: await Course.findAll(),
                    academicYears: await AcademicYear.findAll(),
                    results: { atomResponse, logs: ['Transaction found but User ID missing. Please search for student above.'] },
                    error: 'User ID is missing. Please search and select a student first.'
                });
            }

            // 2. Update/Create Payment Record
            if (paymentRecord) {
                await paymentRecord.update({
                    status: finalStatus,
                    atom_txn_id: atomResponse.atomTxnId,
                    bank_transaction_id: atomResponse.bankTxnId,
                    txnCompleteDate: atomResponse.txnCompleteDate,
                    transaction_date: atomResponse.txnCompleteDate,
                    amount: atomResponse.amount || paymentRecord.amount,
                    user_id: userId || paymentRecord.user_id
                }, { transaction: t });
                logs.push(`Updated payments table record (ID: ${paymentRecord.id})`);
            } else if (isSuccess) {
                paymentRecord = await Payment.create({
                    user_id: userId,
                    academic_year: academicYearId,
                    merchant_txn_id: merchTxnId,
                    amount: atomResponse.amount || 0,
                    status: finalStatus,
                    fee_type: feeType,
                    atom_txn_id: atomResponse.atomTxnId,
                    bank_transaction_id: atomResponse.bankTxnId,
                    txnCompleteDate: atomResponse.txnCompleteDate,
                    transaction_date: atomResponse.txnCompleteDate
                }, { transaction: t });
                logs.push('Created missing record in payments table');
            }

            // 3. Handle Fee Specific Logic
            if (feeType === 'admission_fee') {
                if (feeLog) {
                    await feeLog.update({
                        status: finalStatus,
                        atom_txn_id: atomResponse.atomTxnId,
                        bank_transaction_id: atomResponse.bankTxnId,
                        txnCompleteDate: atomResponse.txnCompleteDate,
                        transaction_date: atomResponse.txnCompleteDate,
                        amount: atomResponse.amount || feeLog.amount,
                        user_id: userId || feeLog.user_id
                    }, { transaction: t });
                    logs.push(`Updated student_fees_details record (ID: ${feeLog.id})`);
                } else if (isSuccess) {
                    const targetSem = await Semester.findByPk(semesterId);
                    const semesterType = (targetSem && parseInt(targetSem.order) % 2 === 0) ? 'Even' : 'Odd';
                    
                    feeLog = await StudentFeeDetail.create({
                        user_id: String(userId),
                        course_id: String(courseId),
                        semester_id: String(semesterId),
                        semester_type: semesterType,
                        academic_year: String(academicYearId),
                        amount: String(atomResponse.amount),
                        payment_method: 'atom',
                        status: finalStatus,
                        merchant_txn_id: merchTxnId,
                        payment_transaction_id: merchTxnId,
                        atom_txn_id: atomResponse.atomTxnId,
                        bank_transaction_id: atomResponse.bankTxnId,
                        txnCompleteDate: atomResponse.txnCompleteDate,
                        transaction_date: atomResponse.txnCompleteDate,
                        remark: 'Synced via Admin Tool'
                    }, { transaction: t });
                    logs.push('Created missing record in student_fees_details table');
                }

                if (isSuccess) {
                    const student = await Student.findOne({ 
                        where: { user_id: String(userId), academic_year: String(academicYearId) },
                        transaction: t
                    });

                    if (student) {
                        const existingAdmission = await StudentAdmissionFeeDetail.findOne({
                            where: { merchant_txn_id: merchTxnId },
                            transaction: t
                        });

                        if (!existingAdmission) {
                            const targetSem = await Semester.findByPk(semesterId || student.year);
                            const semesterType = (targetSem && parseInt(targetSem.order) % 2 === 0) ? 'Even' : 'Odd';

                            await StudentAdmissionFeeDetail.create({
                                user_id: String(userId),
                                student_id: student.id,
                                registration_no: student.registration_no,
                                academic_year: String(academicYearId),
                                semester_id: String(semesterId || student.year),
                                semester_type: semesterType,
                                amount: atomResponse.amount,
                                merchant_txn_id: merchTxnId,
                                bank_transaction_id: atomResponse.bankTxnId,
                                atom_txn_id: atomResponse.atomTxnId,
                                status: 'Success'
                            }, { transaction: t });
                            logs.push('Inserted record into student_admission_fee_details');
                        } else {
                            logs.push('Record already exists in student_admission_fee_details');
                        }
                    } else {
                        logs.push('WARNING: Student record not found. Cannot populate admission_fee_details.');
                    }
                }
            } else if (feeType === 'form_fee' && isSuccess) {
                // Check for student record
                const student = await Student.findOne({
                    where: { user_id: String(userId), academic_year: String(academicYearId) },
                    transaction: t
                });

                if (!student && paymentRecord.payment_payload) {
                    try {
                        const regData = JSON.parse(paymentRecord.payment_payload);
                        await Student.create({
                            user_id: userId,
                            registration_no: regData.registration_no,
                            course_type_id: regData.course_type_id,
                            course_id: regData.course_id,
                            year: regData.semester_id,
                            academic_year: academicYearId,
                            father_name: regData.father_name,
                            mother_name: regData.mother_name,
                            dob: regData.dob
                        }, { transaction: t });
                        logs.push('Created missing Student record from payment payload');
                    } catch (e) {
                        logs.push('ERROR: Could not parse payment payload for student creation');
                    }
                } else if (!student) {
                    logs.push('WARNING: No student record found.');
                }

                // Update User transaction_id
                const user = await User.findByPk(userId, { transaction: t });
                if (user) {
                    await user.update({ transaction_id: merchTxnId, payment_status: 'Success' }, { transaction: t });
                    logs.push('Updated User transaction_id and payment_status');
                }
            }
        }

        await t.commit();

        res.render('admin_panel/payments/sync', {
            title: 'Payment Transaction Sync',
            courses: await Course.findAll(),
            academicYears: await AcademicYear.findAll(),
            results: { atomResponse, logs },
            error: null
        });

    } catch (error) {
        if (t) await t.rollback();
        console.error('Sync Error:', error);
        res.render('admin_panel/payments/sync', {
            title: 'Payment Transaction Sync',
            courses: await Course.findAll(),
            academicYears: await AcademicYear.findAll(),
            results: null,
            error: 'Sync Failed: ' + error.message
        });
    }
};

/**
 * Fetch Student Details by User ID or Registration No
 */
export const fetchStudentDetails = async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) return res.json({ success: false, message: 'ID required' });

        // 1. Try to find in students table
        let student = await Student.findOne({
            where: {
                [sequelize.Sequelize.Op.or]: [
                    { user_id: id },
                    { registration_no: id }
                ]
            },
            include: [
                { model: User, as: 'user' },
                { model: Course, as: 'courseName' }
            ],
            order: [['id', 'DESC']]
        });

        if (student) {
            return res.json({ success: true, student, source: 'students_table' });
        }

        // 2. If not found, check payments table for payload (for incomplete registrations)
        const payment = await Payment.findOne({
            where: { user_id: id, fee_type: 'form_fee' },
            order: [['id', 'DESC']]
        });

        if (payment && payment.payment_payload) {
            try {
                const payload = JSON.parse(payment.payment_payload);
                const user = await User.findByPk(id);
                const course = await Course.findByPk(payload.course_id);
                
                return res.json({ 
                    success: true, 
                    student: {
                        user_id: id,
                        registration_no: payload.registration_no,
                        user: { name: user ? user.name : 'Unknown' },
                        courseName: course,
                        father_name: payload.father_name,
                        academic_year: payload.academic_year
                    },
                    source: 'payment_payload'
                });
            } catch (e) {
                console.error('Payload parse error:', e);
            }
        }

        res.json({ success: false, message: 'Student details not found in database or payment history' });
    } catch (error) {
        console.error('Fetch Student Error:', error);
        res.json({ success: false, message: 'Server error' });
    }
};
