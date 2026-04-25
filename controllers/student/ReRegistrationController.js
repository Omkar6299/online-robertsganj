import { Student, User, AcademicYear, Semester } from '../../models/index.js';
import { sequelize } from '../../config/database.js';
import { handleError, flashSuccessAndRedirect, flashErrorAndRedirect } from '../../utils/responseHelper.js';

export const reRegister = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const userId = req.session.admission_user_id;
        const activeYear = await AcademicYear.findOne({ where: { status: 'Active' }, transaction: t });

        if (!activeYear) {
            await t.rollback();
            return flashErrorAndRedirect(req, res, 'No active academic year found.', '/student/dashboard');
        }

        // Check if already registered for active year
        const existingCurrent = await Student.findOne({
            where: {
                user_id: String(userId),
                academic_year: String(activeYear.id)
            },
            transaction: t
        });

        if (existingCurrent) {
            await t.rollback();
            return flashErrorAndRedirect(req, res, 'You are already registered for the current session.', '/student/dashboard');
        }

        // Find most recent previous record
        const previousStudent = await Student.findOne({
            where: { user_id: String(userId) },
            order: [['created_at', 'DESC']],
            transaction: t
        });

        if (!previousStudent) {
            await t.rollback();
            return flashErrorAndRedirect(req, res, 'No previous registration found to fetch details.', '/student/dashboard');
        }

        // Find the "Registration Enabled" semester for the course
        const targetSemester = await Semester.findOne({
            where: {
                course_id: previousStudent.course_id,
                registration_enabled: 1
            },
            transaction: t
        });

        if (!targetSemester) {
            await t.rollback();
            return flashErrorAndRedirect(req, res, 'Registration is not currently enabled for your course.', '/student/dashboard');
        }

        // DECOUPLING FIX: Create a NEW User record for the new academic year session
        // This ensures changes in this year don't affect previous years' data
        const oldUser = previousStudent.user;
        const newUser = await User.create({
            name: oldUser.name,
            email: oldUser.email,
            phone: oldUser.phone,
            password: oldUser.password,
            transaction_id: oldUser.transaction_id, // Reuse for login during this session transition
            role: 'Student',
            academic_year: String(activeYear.id)
        }, { transaction: t });

        // Create new student record for current year copying previous data
        // We link it to the NEW user_id
        const newStudentData = {
            ...previousStudent.toJSON(),
            id: undefined, // Let it auto-increment
            user_id: String(newUser.id),
            academic_year: String(activeYear.id),
            year: String(targetSemester.id),
            admission_status: 'Approved', // Auto-approved as they are existing students
            // Reset statuses
            personal_status: '1',
            address_status: '1',
            educational_status: '1',
            additional_status: '1',
            weightage_status: '1',
            photographsign_status: '1',
            subject_status: '0', 
            declaration_status: '0',
            photo: previousStudent.photo,
            sign: previousStudent.sign,
            created_at: undefined,
            updated_at: undefined
        };

        const newStudent = await Student.create(newStudentData, { transaction: t });

        // CLONE EDUCATIONAL HISTORY
        // Import Educational model dynamically or use index
        const { Educational } = await import('../../models/index.js');
        const oldEducationals = await Educational.findAll({ 
            where: { user_id: String(userId) },
            transaction: t 
        });

        if (oldEducationals.length > 0) {
            const newEducationals = oldEducationals.map(e => ({
                ...e.toJSON(),
                id: undefined,
                user_id: String(newUser.id),
                registration_no: previousStudent.registration_no,
                created_at: undefined,
                updated_at: undefined
            }));
            await Educational.bulkCreate(newEducationals, { transaction: t });
        }

        await t.commit();

        // Update session to use the NEW user ID
        req.session.admission_user_id = newUser.id;

        // Save session before redirecting to avoid race conditions
        req.session.save((err) => {
            if (err) console.error('Session save error during re-registration:', err);
            flashSuccessAndRedirect(req, res, `Successfully registered for ${activeYear.session}. Please complete subject selection and pay the admission fee.`, '/student/dashboard');
        });

    } catch (error) {
        if (t) await t.rollback();
        handleError(req, res, error, 'An error occurred during re-registration.', '/student/dashboard');
    }
};
