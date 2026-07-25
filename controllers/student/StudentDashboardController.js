import { Student, User, Course, AcademicYear, Semester, StudentAdmissionFeeDetail } from '../../models/index.js';
import { Op } from 'sequelize';
import FeeService from '../../utils/services/FeeService.js';

export const index = async (req, res) => {
    try {
        const userId = req.session.admission_user_id;

        // Resolve target academic session (from session or fallback to Active year)
        const sessionYearId = req.session.admission_academic_year;
        let targetYear = null;
        if (sessionYearId) {
            targetYear = await AcademicYear.findByPk(sessionYearId);
        }
        if (!targetYear) {
            targetYear = await AcademicYear.findOne({ where: { status: 'Active' } });
        }
        const activeYear = targetYear || await AcademicYear.findOne({ where: { status: 'Active' } });

        // Check for student in target academic session
        let student = await Student.findOne({
            where: {
                user_id: String(userId),
                academic_year: String(activeYear ? activeYear.id : '')
            },
            include: [
                { model: User, as: 'user' },
                { model: Course, as: 'courseName' },
                { model: Semester, as: 'semsterName' },
                { model: AcademicYear, as: 'academicYear' }
            ]
        });

        let previousYearStudent = null;
        let nextSemester = null;

        if (!student) {
            // Locate student profile reliably across any academic year / even semester ordered by ID DESC
            student = await Student.findOne({
                where: { user_id: String(userId) },
                order: [['id', 'DESC']],
                include: [
                    { model: User, as: 'user' },
                    { model: Course, as: 'courseName' },
                    { model: Semester, as: 'semsterName' },
                    { model: AcademicYear, as: 'academicYear' }
                ]
            });

            if (!student) {
                req.flash('error', 'Student record not found.');
                return res.redirect('/admission_login');
            }
        }

        // Check for all successful admission fee payments for this semester
        let currentAdmissionPayments = [];
        let totalPaidAmount = 0;
        let calculatedTotalFee = 0;
        let dueAmount = 0;
        let hasDue = false;
        let isFullyPaid = false;

        if (student) {
            currentAdmissionPayments = await StudentAdmissionFeeDetail.findAll({
                where: {
                    user_id: String(userId),
                    status: 'Success',
                    semester_id: String(student.year)
                },
                order: [['created_at', 'ASC']]
            });

            totalPaidAmount = currentAdmissionPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

            // Attempt dynamic fee calculation to check for differential due fee
            try {
                calculatedTotalFee = await FeeService.getCalculatedFee(student, student.year);
                if (totalPaidAmount >= calculatedTotalFee && totalPaidAmount > 0) {
                    isFullyPaid = true;
                    dueAmount = 0;
                } else if (totalPaidAmount > 0 && totalPaidAmount < calculatedTotalFee) {
                    hasDue = true;
                    dueAmount = Number((calculatedTotalFee - totalPaidAmount).toFixed(2));
                } else if (totalPaidAmount === 0) {
                    dueAmount = calculatedTotalFee;
                }
            } catch (feeErr) {
                console.warn('Dashboard fee calculation warning for student:', student.id, feeErr.message);
                if (totalPaidAmount > 0) {
                    isFullyPaid = true;
                }
            }

            // If current semester is fully paid, look for the NEXT semester
            if (isFullyPaid) {
                const currentSem = student.semsterName;
                if (currentSem) {
                    const nextOrder = parseInt(currentSem.order) + 1;
                    nextSemester = await Semester.findOne({
                        where: {
                            course_id: student.course_id,
                            order: String(nextOrder),
                            fee_payment_enabled: 1,
                            status: 1
                        }
                    });
                }
            }
        }

        // Check if next semester payment already exists (Verified Table)
        let nextSemesterPayment = null;
        if (nextSemester) {
            nextSemesterPayment = await StudentAdmissionFeeDetail.findOne({
                where: {
                    user_id: String(userId),
                    status: 'Success',
                    semester_id: String(nextSemester.id)
                }
            });
        }

        res.render('student_panel/home/index', {
            title: 'Student Dashboard',
            student,
            previousYearStudent,
            user: student ? student.user : null,
            admissionPayment: currentAdmissionPayments.length > 0 ? currentAdmissionPayments[0] : null,
            currentAdmissionPayments,
            totalPaidAmount,
            calculatedTotalFee,
            dueAmount,
            hasDue,
            isFullyPaid,
            nextSemester,
            nextSemesterPayment,
            activeYear
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).render('errors/500', { message: 'An error occurred while loading dashboard.' });
    }
};
