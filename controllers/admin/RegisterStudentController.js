import Student from '../../models/Student.js';
import User from '../../models/User.js';
import Course from '../../models/Course.js';
import Semester from '../../models/Semester.js';
import Educational from '../../models/Educational.js';
import Qualification from '../../models/Qualification.js';
import Subject from '../../models/Subject.js';
import Skills from '../../models/Skills.js';
import Cocurricular from '../../models/Cocurricular.js';
import Weightage from '../../models/Weightage.js';
import StudentWeightage from '../../models/StudentWeightage.js';
import AcademicYear from '../../models/AcademicYear.js';
import SemesterQualification from '../../models/SemesterQualification.js';
import StudentAdmissionFeeDetail from '../../models/StudentAdmissionFeeDetail.js';
import Payment from '../../models/Payment.js';
import { Op, QueryTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { handleError, flashSuccessAndRedirect, flashErrorAndRedirect } from '../../utils/responseHelper.js';
import ExcelJS from 'exceljs';

export const index = async (req, res) => {
    try {
        const { course_id, status, academic_year_id } = req.query;

        // Get active academic year for default filter if none provided
        const activeYear = await AcademicYear.findOne({ where: { status: 'Active' } });
        const defaultYearId = activeYear ? activeYear.id : null;
        const currentYearId = academic_year_id || defaultYearId;

        // Build filter conditions
        const where = {};
        if (currentYearId) {
            where.academic_year = String(currentYearId);
        }
        if (course_id && course_id !== '') {
            where.course_id = course_id;
        }
        if (status && status !== '') {
            where.admission_status = status;
        }

        const students = await Student.findAll({
            where,
            include: [
                { model: User, as: 'user' },
                { model: Course, as: 'courseName' },
                {
                    model: StudentAdmissionFeeDetail,
                    as: 'admissionFeeDetails',
                    where: { status: 'Success' },
                    required: false
                }
            ],
            order: [['created_at', 'DESC']]
        });

        // Fetch courses for filter dropdown
        const courses = await Course.findAll({ order: [['name', 'ASC']] });
        // Fetch academic years for filter dropdown
        const academicYears = await AcademicYear.findAll({ order: [['session', 'DESC']] });

        res.render('admin_panel/student/register_student_list', {
            title: 'Registered Students',
            students,
            courses,
            academicYears,
            activeYearId: currentYearId,
            filters: { course_id: course_id || '', status: status || '', academic_year_id: currentYearId }
        });
    } catch (error) {
        handleError(req, res, error, 'An error occurred while loading student list.', '/admin/dashboard');
    }
};

export const admittedStudents = async (req, res) => {
    try {
        const { course_id, gender, category, start_date, end_date, academic_year_id, registration_no, semester_id } = req.query;

        // Get active academic year for default filter if none provided/specified
        const activeYear = await AcademicYear.findOne({ where: { status: 'Active' } });
        const defaultYearId = activeYear ? activeYear.id : null;

        // If academic_year_id is undefined (initial load), use default.
        // If it's an empty string (user chose "All"), keep it empty to skip the filter.
        const currentYearId = academic_year_id !== undefined ? academic_year_id : defaultYearId;

        // Build filter conditions for Student
        const studentWhere = {};

        if (currentYearId && currentYearId !== '') {
            studentWhere.academic_year = String(currentYearId);
        }
        if (course_id && course_id !== '') {
            studentWhere.course_id = course_id;
        }
        if (gender && gender !== '') {
            studentWhere.gender = gender;
        }
        if (category && category !== '') {
            studentWhere.category = category;
        }
        if (registration_no && registration_no.trim() !== '') {
            studentWhere.registration_no = { [Op.like]: `%${registration_no.trim()}%` };
        }
        if (semester_id && semester_id !== '') {
            studentWhere.year = semester_id;
        }

        // Build date range filter
        // Note: Filter applies to StudentAdmissionFeeDetail created_at (the actual admission/payment date)
        const paymentWhere = { status: 'Success' };
        if (start_date || end_date) {
            paymentWhere.created_at = {};
            if (start_date) {
                const startDateObj = new Date(start_date);
                startDateObj.setHours(0, 0, 0, 0);
                paymentWhere.created_at[Op.gte] = startDateObj;
            }
            if (end_date) {
                const endDateObj = new Date(end_date);
                endDateObj.setHours(23, 59, 59, 999);
                paymentWhere.created_at[Op.lte] = endDateObj;
            }
        }

        // Use the Stored Procedure
        const students_raw = await sequelize.query(`
            CALL GetAdmittedStudentsReport(:academic_year_id, :course_id, :semester_id, :registration_no, :gender, :category, :start_date, :end_date)
        `, {
            replacements: {
                academic_year_id: currentYearId || null,
                course_id: course_id || null,
                semester_id: semester_id || null,
                registration_no: registration_no || null,
                gender: gender || null,
                category: category || null,
                start_date: start_date ? new Date(start_date) : null,
                end_date: end_date ? (new Date(end_date).setHours(23, 59, 59, 999), new Date(end_date)) : null
            },
            type: QueryTypes.RAW
        });

        // For MySQL CALL, results structure can be nested: [ [rows_array, OkPacket], metadata ]
        // or for simple queries: [ rows_array, metadata ]
        let raw_data = [];
        if (Array.isArray(students_raw)) {
            if (Array.isArray(students_raw[0])) {
                // If the first element is also an array, it's likely the rows_array from a CALL
                // But we must check if that array contains rows or just another array
                raw_data = Array.isArray(students_raw[0][0]) ? students_raw[0][0] : students_raw[0];
            } else {
                raw_data = students_raw;
            }
        }

        // Map flat results back to nested structure for EJS compatibility
        const students = raw_data.map(student => ({
            ...student,
            user: {
                name: student.student_name,
                phone: student.student_phone,
                email: student.student_email
            },
            courseName: {
                name: student.course_name
            },
            semsterName: {
                name: student.semester_name
            },
            admissionFeeDetails: [{
                created_at: student.admission_date,
                amount: student.paid_amount
            }]
        }));

        const courses = await Course.findAll({ order: [['name', 'ASC']] });
        const semesters = await Semester.findAll({
            include: [{ model: Course, as: 'course' }],
            order: [[{ model: Course, as: 'course' }, 'name', 'ASC'], ['name', 'ASC']]
        });
        const academicYears = await AcademicYear.findAll({ order: [['session', 'DESC']] });

        res.render('admin_panel/student/admitted_student_list', {
            title: 'Admitted Students Report',
            students,
            courses,
            semesters,
            academicYears,
            activeYearId: currentYearId,
            filters: {
                course_id: course_id || '',
                gender: gender || '',
                category: category || '',
                start_date: start_date || '',
                end_date: end_date || '',
                academic_year_id: currentYearId,
                registration_no: registration_no || '',
                semester_id: semester_id || ''
            }
        });
    } catch (error) {
        handleError(req, res, error, 'An error occurred while loading admitted student list.', '/admin/dashboard');
    }
};

export const exportAdmittedStudents = async (req, res) => {
    try {
        const { course_id, gender, category, start_date, end_date, academic_year_id, registration_no, semester_id } = req.query;

        // Get active academic year for default filter if none provided/specified
        const activeYear = await AcademicYear.findOne({ where: { status: 'Active' } });
        const defaultYearId = activeYear ? activeYear.id : null;
        const currentYearId = academic_year_id !== undefined ? academic_year_id : defaultYearId;

        // Use the Stored Procedure
        const results = await sequelize.query(`
            CALL GetAdmittedStudentsReport(:academic_year_id, :course_id, :semester_id, :registration_no, :gender, :category, :start_date, :end_date)
        `, {
            replacements: {
                academic_year_id: currentYearId || null,
                course_id: course_id || null,
                semester_id: semester_id || null,
                registration_no: registration_no || null,
                gender: gender || null,
                category: category || null,
                start_date: start_date ? new Date(start_date) : null,
                end_date: end_date ? (new Date(end_date).setHours(23, 59, 59, 999), new Date(end_date)) : null
            },
            type: QueryTypes.RAW
        });

        // For MySQL CALL, results structure can be nested: [ [rows_array, OkPacket], metadata ]
        let students = [];
        if (Array.isArray(results)) {
            if (Array.isArray(results[0])) {
                students = Array.isArray(results[0][0]) ? results[0][0] : results[0];
            } else {
                students = results;
            }
        }

        // Filter out any non-object entries (like OkPacket) just in case
        students = students.filter(s => s && typeof s === 'object' && (s.user_id || s.registration_no));

        // Fetch education details for all students
        const studentIds = students.map(s => String(s.user_id));
        const allEducationals = await Educational.findAll({
            where: { user_id: { [Op.in]: studentIds } },
            include: [{ model: Qualification, as: 'qualification' }],
            order: [['year_of_passing', 'ASC']]
        });

        // Group education details by user_id
        const educationMap = {};
        allEducationals.forEach(edu => {
            if (!educationMap[edu.user_id]) educationMap[edu.user_id] = [];
            educationMap[edu.user_id].push(edu);
        });

        // Find max education records for dynamic columns
        let maxEducations = 0;
        students.forEach(student => {
            const count = (educationMap[student.user_id] || []).length;
            if (count > maxEducations) maxEducations = count;
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Admitted Students');

        // Define base columns
        const excelColumns = [
            { header: 'S.No', key: 'sno', width: 5 },
            { header: 'Registration No', key: 'registration_no', width: 15 },
            { header: 'Admission Date', key: 'admission_date', width: 15 },
            { header: 'Academic Session', key: 'academic_session', width: 15 },
            { header: 'Course', key: 'course_name', width: 25 },
            { header: 'Semester', key: 'semester_name', width: 15 },
            { header: 'Name', key: 'student_name', width: 25 },
            { header: 'Father Name', key: 'father_name', width: 25 },
            { header: 'Mother Name', key: 'mother_name', width: 25 },
            { header: 'Gender', key: 'gender', width: 10 },
            { header: 'DOB', key: 'dob', width: 12 },
            { header: 'Category', key: 'category', width: 12 },
            { header: 'Religion', key: 'religion', width: 12 },
            { header: 'Caste', key: 'caste', width: 15 },
            { header: 'Phone', key: 'student_phone', width: 15 },
            { header: 'Email', key: 'student_email', width: 25 },
            { header: 'Aadhar No', key: 'adhar_no', width: 15 },
            { header: 'Samarth No', key: 'samarth_no', width: 15 },
            { header: 'Blood Group', key: 'blood_group', width: 10 },
            { header: 'Address', key: 'permanent_address', width: 40 },
            { header: 'State', key: 'permanent_state', width: 15 },
            { header: 'District', key: 'permanent_district', width: 15 },
            { header: 'Tehsil', key: 'permanent_tehsil', width: 15 },
            { header: 'Pincode', key: 'permanent_pincode', width: 10 },
            { header: 'Paid Amount', key: 'paid_amount', width: 12 },
            { header: 'Subject 1', key: 'major1_name', width: 20 },
            { header: 'Subject 2', key: 'major2_name', width: 20 },
            { header: 'Subject 3', key: 'minor_name', width: 20 },
        ];

        // Add dynamic education columns
        for (let i = 1; i <= maxEducations; i++) {
            excelColumns.push(
                // { header: `Edu ${i} Course Name`, key: `edu${i}_name`, width: 15 },
                { header: `Course Name`, key: `edu${i}_school`, width: 25 },
                { header: `Board/University`, key: `edu${i}_board`, width: 25 },
                { header: `Year of Passing`, key: `edu${i}_year`, width: 15 },
                { header: `Roll Number`, key: `edu${i}_roll`, width: 15 },
                { header: `Obtain Marks`, key: `edu${i}_obtain`, width: 15 },
                { header: `Max Marks`, key: `edu${i}_max`, width: 15 }
            );
        }

        worksheet.columns = excelColumns;

        // Format Header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // Add Data
        students.forEach((student, index) => {
            const edus = educationMap[student.user_id] || [];

            const data = {
                sno: index + 1,
                registration_no: student.registration_no,
                admission_date: student.admission_date ? new Date(student.admission_date).toLocaleDateString('en-IN') : '-',
                academic_session: student.academic_session,
                course_name: student.course_name,
                semester_name: student.semester_name || '-',
                student_name: student.student_name,
                father_name: student.father_name,
                mother_name: student.mother_name,
                gender: student.gender,
                dob: student.dob,
                category: student.category,
                religion: student.religion,
                caste: student.caste,
                student_phone: student.student_phone,
                student_email: student.student_email,
                adhar_no: student.adhar_no,
                samarth_no: student.samarth_no,
                blood_group: student.blood_group,
                permanent_address: student.permanent_address,
                permanent_state: student.permanent_state,
                permanent_district: student.permanent_district,
                permanent_tehsil: student.permanent_tehsil,
                permanent_pincode: student.permanent_pincode,
                paid_amount: student.paid_amount,
                major1_name: student.major1_name || '-',
                major2_name: student.major2_name || '-',
                minor_name: student.minor_name || '-',
            };

            // Fill education dynamic fields
            edus.forEach((edu, i) => {
                const idx = i + 1;
                data[`edu${idx}_name`] = edu.qualification ? edu.qualification.name : edu.class_name;
                data[`edu${idx}_school`] = edu.school_name || '-';
                data[`edu${idx}_board`] = edu.board_name || '-';
                data[`edu${idx}_year`] = edu.year_of_passing || '-';
                data[`edu${idx}_roll`] = edu.roll_no || '-';
                data[`edu${idx}_obtain`] = edu.obtained_marks || '-';
                data[`edu${idx}_max`] = edu.total_marks || '-';
            });

            worksheet.addRow(data);
        });

        // Set content type and file name
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=Admitted_Students_${new Date().getTime()}.xlsx`
        );

        return workbook.xlsx.write(res).then(() => {
            res.status(200).end();
        });

    } catch (error) {
        console.error('Error exporting admitted students:', error);
        req.flash('error', 'An error occurred while exporting the student list.');
        res.redirect('/admin/admitted_student_list');
    }
};

export const feePaymentStatusReport = async (req, res) => {
    try {
        const { course_id, academic_year_id, semester_id, status } = req.query;

        // Get active academic year for default filter
        const activeYear = await AcademicYear.findOne({ where: { status: 'Active' } });
        const defaultYearId = activeYear ? activeYear.id : null;
        const currentYearId = academic_year_id || defaultYearId;

        // Fetch all courses for dropdown
        const courses = await Course.findAll({
            where: { status: '1' },
            order: [['name', 'ASC']]
        });

        // Fetch all academic years for dropdown
        const academicYears = await AcademicYear.findAll({ order: [['session', 'DESC']] });

        // Fetch semesters for the selected course
        let semesters = [];
        if (course_id) {
            semesters = await Semester.findAll({
                where: { course_id: String(course_id) },
                order: [['order', 'ASC']]
            });
        }

        let students = [];
        if (semester_id) {
            // Build filter conditions for Student
            const studentWhere = {
                academic_year: String(currentYearId),
                admission_status: 'Approved' // Usually only approved students are tracked for fees
            };

            if (course_id && course_id !== '') {
                studentWhere.course_id = course_id;
            }

            // Find all students and their payment status for the target semester
            students = await Student.findAll({
                where: studentWhere,
                include: [
                    { model: User, as: 'user' },
                    { model: Course, as: 'courseName' },
                    { model: Semester, as: 'semsterName' },
                    {
                        model: StudentAdmissionFeeDetail,
                        as: 'admissionFeeDetails',
                        where: {
                            semester_id: String(semester_id),
                            status: 'Success'
                        },
                        required: status === 'Paid' // Inner join if filtering for paid only
                    }
                ],
                order: [['created_at', 'DESC']]
            });

            // If filtering for unpaid only, filter manually (Sequelize doesn't support easy "NOT EXISTS" without raw subquery)
            if (status === 'Unpaid') {
                students = students.filter(s => !s.admissionFeeDetails || s.admissionFeeDetails.length === 0);
            }
        }

        res.render('admin_panel/student/fee_payment_report', {
            title: 'Fee Payment Status Report',
            students,
            courses,
            academicYears,
            semesters,
            activeYearId: currentYearId,
            filters: {
                course_id: course_id || '',
                academic_year_id: currentYearId,
                semester_id: semester_id || '',
                status: status || 'All'
            }
        });
    } catch (error) {
        handleError(req, res, error, 'An error occurred while loading fee payment report.', '/admin/dashboard');
    }
};

export const show = async (req, res) => {
    try {
        const { id } = req.params;

        // Find student by id with all associations for a rich preview
        const student = await Student.findByPk(id, {
            include: [
                { model: User, as: 'user' },
                { model: Course, as: 'courseName' },
                { model: Semester, as: 'semsterName' },
                { model: Subject, as: 'major1' },
                { model: Subject, as: 'major2' },
                { model: Subject, as: 'minor' },
                { model: Subject, as: 'researchProject' },
                { model: Skills, as: 'skill' },
                { model: Cocurricular, as: 'cocurricular' },
                { model: AcademicYear, as: 'academicYear' },
                {
                    model: StudentWeightage,
                    as: 'studentWeightages',
                    include: [{ model: Weightage, as: 'weightageInfo' }]
                }
            ]
        });

        if (!student) {
            req.flash('error', 'Student not found.');
            return res.redirect('/admin/register_student_list');
        }

        // Fetch educational details
        const educationals = await Educational.findAll({
            where: { user_id: String(student.user_id) },
            include: [{ model: Qualification, as: 'qualification' }]
        });

        // Fetch weightages
        const weightages = await Weightage.findAll();

        return res.render('admin_panel/student/show', {
            title: 'Student Application Review',
            student: student,
            educationals: educationals,
            weightages: weightages
        });
    } catch (error) {
        handleError(req, res, error, 'An error occurred while loading student view.', '/admin/dashboard');
    }
};

export const edit = async (req, res) => {
    try {
        const { id } = req.params;

        const student = await Student.findByPk(id, {
            include: [
                { model: User, as: 'user' },
                { model: Course, as: 'courseName' },
                { model: Semester, as: 'semsterName' },
                { model: Subject, as: 'major1' },
                { model: Subject, as: 'major2' },
                { model: Subject, as: 'minor' },
                { model: Subject, as: 'researchProject' },
                { model: Skills, as: 'skill' },
                { model: Cocurricular, as: 'cocurricular' },
                { model: AcademicYear, as: 'academicYear' },
                {
                    model: StudentWeightage,
                    as: 'studentWeightages',
                    include: [{ model: Weightage, as: 'weightageInfo' }]
                }
            ]
        });

        if (!student) {
            req.flash('error', 'Student not found.');
            return res.redirect('/admin/register_student_list');
        }

        // BLOCK EDIT IF PAID
        const paidStatus = await StudentAdmissionFeeDetail.findOne({
            where: { student_id: id, semester_id: String(student.year), status: 'Success' }
        });

        if (paidStatus) {
            return flashErrorAndRedirect(req, res, 'Student details cannot be edited after successful payment.', '/admin/register_student_list');
        }

        const educationals = await Educational.findAll({
            where: { user_id: String(student.user_id) },
            include: [{ model: Qualification, as: 'qualification' }]
        });

        const educationalDetails = {};
        educationals.forEach(edu => {
            const qualName = edu.school_name || (edu.qualification ? edu.qualification.name : edu.class_name);
            educationalDetails[qualName] = edu;
        });

        const semesterQuals = await SemesterQualification.findAll({
            where: { semester_id: student.year },
            include: [{ model: Qualification, as: 'qualification' }]
        });
        const qualifications = semesterQuals.map(sq => ({
            id: sq.qualification.id,
            name: sq.qualification.name,
            status: sq.required_optional_hidden,
            max_year_gap: sq.max_year_gap
        }));

        const subjects = await Subject.findAll({ where: { course_id: student.course_id, status: '1' } });
        const skills = await Skills.findAll({
            where: {
                course_id: student.course_id,
                semester_id: student.year,
                status: '1'
            }
        });
        const cocurriculars = await Cocurricular.findAll({
            where: {
                course_id: student.course_id,
                semester_id: student.year,
                status: '1'
            }
        });
        const weightages = await Weightage.findAll();

        const studentWeightages = await StudentWeightage.findAll({ where: { registration_no: student.registration_no } });
        const selectedWeightageIds = studentWeightages.map(sw => sw.weightage_id.toString());

        const courses = await Course.findAll({ order: [['name', 'ASC']] });

        res.render('admin_panel/student/student_edit', {
            title: 'Edit Student Details',
            student,
            educationals,
            educationalDetails,
            qualifications,
            subjects,
            skills,
            cocurriculars,
            weightages,
            selectedWeightageIds,
            selectedSubjects: {
                major1_id: student.major1_id,
                major2_id: student.major2_id,
                minor_id: student.minor_id,
                research_project_id: student.research_project_id,
                skill_id: student.skill_id,
                cocurricular_id: student.cocurricular_id
            },
            courses,
            error: req.flash('error'),
            success: req.flash('success')
        });
    } catch (error) {
        console.error('Error in edit:', error);
        handleError(req, res, error, 'An error occurred while loading student details.', '/admin/register_student_list');
    }
};

export const update = async (req, res) => {
    try {
        const { id } = req.params;

        const student = await Student.findByPk(id, {
            include: [{ model: User, as: 'user' }]
        });

        if (!student) {
            return flashErrorAndRedirect(req, res, 'Student not found.', '/admin/register_student_list');
        }

        // BLOCK UPDATE IF PAID
        const paidStatus = await StudentAdmissionFeeDetail.findOne({
            where: { student_id: id, semester_id: String(student.year), status: 'Success' }
        });

        if (paidStatus) {
            return flashErrorAndRedirect(req, res, 'Student details cannot be updated after successful payment.', '/admin/register_student_list');
        }

        const {
            // User fields
            name, email, phone,
            // Student personal fields
            father_name, mother_name, dob, gender, category, sub_category,
            religion, caste, cast_certificate_no, blood_group, adhar_no,
            epic_no, samarth_no, is_18_plus, whatsapp_number,
            // Address fields
            mailing_address, mailing_state, mailing_district, mailing_tehsil, mailing_pincode,
            permanent_address, permanent_state, permanent_district, permanent_tehsil, permanent_pincode,
            local_guadian, local_guadian_address, guadian_contact,
            // Other fields
            father_occupation, mother_occupation, family_annual_income, income_certificate_no,
            bank_name, bank_account_no, ifsc_code,
            computer_literate, extracurricular_activity, is_previous_student,
            disability_percentage, year_gap, year_gap_after_inter, gap_reason,
            // Subject fields
            major1_id, major2_id, minor_id, research_project_id, skill_id, cocurricular_id,
            // Weightage fields
            weightage_ids,
            // Educational fields
            board, year, percentage, roll_no, qual_name, mark_type, cgpa, total_marks, obtained_marks
        } = req.body;

        // Update User record (Identity fields name, phone, email are locked and ignored here)
        // await User.update(
        //     { name, email, phone },
        //     { where: { id: student.user_id } }
        // );

        // Update Student record (Identity fields father_name, mother_name, dob are locked and ignored here)
        await student.update({
            gender, category, sub_category,
            religion, caste, cast_certificate_no, blood_group, adhar_no,
            epic_no, samarth_no, is_18_plus, whatsapp_number,
            mailing_address, mailing_state, mailing_district, mailing_tehsil, mailing_pincode,
            permanent_address, permanent_state, permanent_district, permanent_tehsil, permanent_pincode,
            local_guadian, local_guadian_address, guadian_contact,
            father_occupation, mother_occupation, family_annual_income, income_certificate_no,
            bank_name, bank_account_no, ifsc_code,
            computer_literate, extracurricular_activity, is_previous_student,
            disability_percentage, year_gap, year_gap_after_inter, gap_reason,
            major1_id: major1_id || null,
            major2_id: major2_id || null,
            minor_id: minor_id || null,
            research_project_id: research_project_id || null,
            skill_id: skill_id || null,
            cocurricular_id: cocurricular_id || null
        });

        // Update Weightages
        await StudentWeightage.destroy({ where: { registration_no: student.registration_no } });
        const weightageJson = {};
        if (weightage_ids && Array.isArray(weightage_ids)) {
            const weightageRecords = weightage_ids.map(wId => ({
                user_id: String(student.user_id),
                registration_no: student.registration_no,
                weightage_id: wId,
                status: true
            }));
            if (weightageRecords.length > 0) {
                await StudentWeightage.bulkCreate(weightageRecords);
            }
            weightage_ids.forEach(wId => weightageJson[wId] = "1");
        } else if (weightage_ids) {
            await StudentWeightage.create({
                user_id: String(student.user_id),
                registration_no: student.registration_no,
                weightage_id: weightage_ids,
                status: true
            });
            weightageJson[weightage_ids] = "1";
        }
        await student.update({ weightage: weightageJson });

        // Update Educationals
        await Educational.destroy({ where: { registration_no: student.registration_no } });
        const educationRecords = [];
        if (board) {
            for (const qualId in board) {
                if (board[qualId] && board[qualId].trim() !== '') {
                    educationRecords.push({
                        user_id: String(student.user_id),
                        registration_no: student.registration_no,
                        class_name: qualId,
                        school_name: qual_name ? qual_name[qualId] : '',
                        board_name: board[qualId],
                        year_of_passing: year ? year[qualId] : null,
                        percentage: percentage ? percentage[qualId] : null,
                        cgpa: cgpa ? cgpa[qualId] : null,
                        mark_type: mark_type ? mark_type[qualId] : null,
                        total_marks: total_marks ? total_marks[qualId] : null,
                        obtained_marks: obtained_marks ? obtained_marks[qualId] : null,
                        roll_no: roll_no ? roll_no[qualId] : null
                    });
                }
            }
        }
        if (educationRecords.length > 0) {
            await Educational.bulkCreate(educationRecords);
        }

        flashSuccessAndRedirect(req, res, 'Student details updated successfully.', `/admin/students/${id}/edit`);
    } catch (error) {
        handleError(req, res, error, 'An error occurred while updating student details.', `/admin/students/${req.params.id}/edit`);
    }
};

export const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { admission_status } = req.body;

        const validStatuses = ['Pending', 'Approved', 'Disapproved'];
        if (!validStatuses.includes(admission_status)) {
            return flashErrorAndRedirect(req, res, 'Invalid admission status.', `/admin/students/${id}/edit`);
        }

        const student = await Student.findByPk(id);
        if (!student) {
            return flashErrorAndRedirect(req, res, 'Student not found.', '/admin/register_student_list');
        }

        await student.update({ admission_status });

        flashSuccessAndRedirect(req, res, `Admission status updated to "${admission_status}" successfully.`, `/admin/students/${id}/edit`);
    } catch (error) {
        handleError(req, res, error, 'An error occurred while updating admission status.', `/admin/students/${req.params.id}/edit`);
    }
};
