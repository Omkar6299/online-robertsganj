import { Student, User, Course, AcademicYear, Semester, StudentAdmissionFeeDetail } from '../../models/index.js';
import { Op } from 'sequelize';

export const index = async (req, res) => {
    try {
        const userId = req.session.admission_user_id;

        // Get active academic year
        const activeYear = await AcademicYear.findOne({ where: { status: 'Active' } });

        // Check for student in active year
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
            // Find most recent record from any year for this user
            previousYearStudent = await Student.findOne({
                where: { user_id: String(userId) },
                order: [['created_at', 'DESC']],
                include: [
                    { model: User, as: 'user' },
                    { model: Course, as: 'courseName' },
                    { model: Semester, as: 'semsterName' },
                    { model: AcademicYear, as: 'academicYear' }
                ]
            });
            
            // If no record at all, they shouldn't be here (session should have failed)
            if (!previousYearStudent) {
                req.flash('error', 'Student record not found.');
                return res.redirect('/admission_login');
            }
        }

        // Check for successful admission fee payment in the current record (Verified Table)
        let currentAdmissionPayment = null;
        if (student) {
            currentAdmissionPayment = await StudentAdmissionFeeDetail.findOne({
                where: {
                    user_id: String(userId),
                    status: 'Success',
                    semester_id: String(student.year)
                }
            });

            // If current semester is paid, look for the NEXT semester
            if (currentAdmissionPayment) {
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
            user: student ? student.user : previousYearStudent.user,
            admissionPayment: currentAdmissionPayment,
            nextSemester,
            nextSemesterPayment,
            activeYear
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).render('errors/500', { message: 'An error occurred while loading dashboard.' });
    }
};
