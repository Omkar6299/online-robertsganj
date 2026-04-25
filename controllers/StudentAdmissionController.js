import {
    User,
    Student,
    Course,
    CourseType,
    Semester,
    AcademicYear,
    Educational,
    Qualification,
    Weightage,
    Subject,
    SemesterQualification,
    State,
    Skills,
    Cocurricular,
    StudentWeightage
} from '../models/index.js';
import { Op } from 'sequelize';
import { handleError, flashSuccessAndRedirect, flashErrorAndRedirect } from '../utils/responseHelper.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to extract S3 key from URL
const getS3Key = (url) => {
    if (!url) return null;
    try {
        const urlObj = new URL(url);
        // For standard S3 URLs (https://bucket.s3.region.amazonaws.com/key)
        // pathname will be /key
        return decodeURIComponent(urlObj.pathname.substring(1));
    } catch (e) {
        // If it's not a valid URL, it might already be a key or a local path
        return url;
    }
};

export const registrationForm = async (req, res) => {
    try {
        const userId = req.session.admission_user_id;

        // Get active academic year
        const activeAcademicYear = await AcademicYear.findOne({ where: { status: 'Active' } });

        // Get student record
        const student = await Student.findOne({
            where: { user_id: String(userId), academic_year: String(activeAcademicYear.id) },
            include: [
                { model: User, as: 'user' },
                { model: Course, as: 'courseName' },
                { model: Semester, as: 'semsterName' }
            ]
        });

        if (!student) {
            req.flash('error', 'Student record not found.');
            return res.redirect('/student/dashboard');
        }

        // Check if application is already approved
        if (student.admission_status === 'Approved') {
            req.flash('error', 'Your application has already been approved and cannot be edited.');
            return res.redirect('/student/dashboard');
        }

        // Check if application is already submitted
        if (student.declaration_status === '1') {
            req.flash('error', 'Your application has already been submitted and cannot be edited.');
            return res.redirect('/student/dashboard');
        }

        const semOrder = student.semsterName ? parseInt(student.semsterName.order) : 0;
        const isReRegistration = semOrder > 1;
        let previousStudent = null;

        if (isReRegistration && student.student_id) {
            previousStudent = await Student.findOne({
                where: {
                    student_id: student.student_id,
                    academic_year: { [Op.ne]: String(activeAcademicYear.id) }
                },
                order: [['created_at', 'DESC']]
            });
        }

        // Prepare selected subjects array for pre-filling (converted to object for easier EJS access)
        const selectedSubjects = {
            major1_id: student.major1_id || (previousStudent ? previousStudent.major1_id : null),
            major2_id: student.major2_id || (previousStudent ? previousStudent.major2_id : null),
            minor_id: student.minor_id || (previousStudent ? previousStudent.minor_id : null),
            research_project_id: student.research_project_id,
            skill_id: student.skill_id, // Skill is semester-specific, don't auto-fill from previous
            cocurricular_id: student.cocurricular_id // Co-curricular is semester-specific
        };

        // Get qualifications for this semester
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

        // Get educational details already filled (scoped to current session user_id)
        let educationals = await Educational.findAll({ where: { user_id: String(userId) } });

        // If it's a re-registration and current educational details are empty, fetch from previous record
        if (isReRegistration && previousStudent && educationals.length === 0) {
            educationals = await Educational.findAll({ where: { user_id: String(previousStudent.user_id) } });
        }

        const educationalDetails = {};
        educationals.forEach(e => {
            const key = e.school_name ? e.school_name : e.class_name;
            educationalDetails[key] = e;
        });

        // Get states
        const states = await State.findAll();

        // Get weightages
        const weightages = await Weightage.findAll({ where: { status: true } });

        // Get student's selected weightages (scoped to current session user_id)
        const studentWeightages = await StudentWeightage.findAll({
            where: { user_id: String(userId) }
        });
        const selectedWeightageIds = studentWeightages.map(sw => sw.weightage_id.toString());

        // Get subjects for this course
        const subjects = await Subject.findAll({ where: { course_id: student.course_id, status: '1' } });

        // Get skills and cocurricular
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

        // Get dynamic document mappings for this course and semester
        const { CourseSemesterDocument, DocumentType, StudentDocument } = await import('../models/index.js');
        const documentMappings = await CourseSemesterDocument.findAll({
            where: {
                course_id: student.course_id,
                semester_id: student.year,
                status: true
            },
            include: [{ model: DocumentType, as: 'documentType' }]
        });

        // Get already uploaded documents for this student/semester
        const uploadedDocuments = await StudentDocument.findAll({
            where: {
                student_id: student.id,
                semester_id: student.year
            },
            include: [{ model: DocumentType, as: 'documentType' }]
        });

        const uploadedDocsMap = {};
        uploadedDocuments.forEach(doc => {
            uploadedDocsMap[doc.documentType.code] = doc;
        });

        // Determine active tab
        let stepsOrder = ['personal', 'address', 'educational', 'subject', 'other', 'weightage', 'photo', 'declaration'];

        if (isReRegistration) {
            // Remove weightage from steps for re-registration
            stepsOrder = stepsOrder.filter(step => step !== 'weightage');
        }

        let activeTab = req.query.tab || 'personal';

        // Automatic tab detection if not manually specified
        if (!req.query.tab) {
            if (student.photographsign_status === '1') activeTab = 'declaration';
            else if (student.weightage_status === '1' || (isReRegistration && student.additional_status === '1')) activeTab = 'photo';
            else if (student.additional_status === '1') activeTab = 'weightage';
            else if (student.subject_status === '1') activeTab = 'other';
            else if (student.educational_status === '1') activeTab = 'subject';
            else if (student.address_status === '1') activeTab = 'educational';
            else if (student.personal_status === '1') activeTab = 'address';
        }

        const currentYear = new Date().getFullYear();

        res.render('student_panel/admission/registration_form', {
            title: 'Admission Registration Form',
            student,
            user: student.user,
            activeAcademicYear,
            activeTab,
            personalDetails: student.user,
            studentPersonalDetail: student || {},
            addressDetails: student || {},
            qualifications,
            educationalDetails,
            selectedWeightageIds,
            selectedSubjects,
            weightageDetails: student.weightage || (previousStudent ? previousStudent.weightage : {}),
            photoDetails: { 
                photograph: student.photo || (previousStudent ? previousStudent.photo : null), 
                signature: student.sign || (previousStudent ? previousStudent.sign : null) 
            },
            states,
            weightages,
            subjects,
            skills,
            cocurriculars,
            documentMappings,
            uploadedDocsMap,
            isReRegistration,
            previousStudent,
            stepsOrder,
            oldInput: req.flash('oldInput')[0] || {},
            currentYear
        });
    } catch (error) {
        handleError(req, res, error, 'An error occurred while loading registration form.', '/student/dashboard');
    }
};

export const personalDetailsPost = async (req, res) => {
    try {
        const userId = req.session.admission_user_id;
        const {
            name, father_name, mother_name, dob, gender, category, phone, email, religion,
            caste, cast_certificate_no, blood_group, adhar_no, epic_no, samarth_no, is_18_plus
        } = req.body;

        // Get active academic year
        const activeAcademicYear = await AcademicYear.findOne({ where: { status: 'Active' } });

        // Update Student record
        const student = await Student.findOne({
            where: {
                user_id: String(userId),
                academic_year: String(activeAcademicYear.id)
            }
        });

        if (!student) {
            req.flash('error', 'Student record not found.');
            return res.redirect('/student/dashboard');
        }

        // Check if already approved
        if (student.admission_status === 'Approved') {
            req.flash('error', 'Your application has already been approved and cannot be edited.');
            return res.redirect('/student/dashboard');
        }

        // Check if already submitted
        if (student.declaration_status === '1') {
            req.flash('error', 'Your application has already been submitted and cannot be edited.');
            return res.redirect('/student/dashboard');
        }

        await student.update({
            gender, category, religion,
            caste, cast_certificate_no, blood_group, adhar_no, epic_no, samarth_no, is_18_plus,
            personal_status: '1'
        });

        // Update User record (Identity fields name, phone, email are locked and ignored here)
        // await User.update(
        //     { name, phone, email },
        //     { where: { id: userId } }
        // );

        flashSuccessAndRedirect(req, res, 'Personal details saved successfully.', '/student/registration?tab=address');
    } catch (error) {
        req.flash('oldInput', req.body);
        handleError(req, res, error, 'An error occurred while saving personal details.', '/student/registration');
    }
};

export const addressDetailsPost = async (req, res) => {
    try {
        const userId = req.session.admission_user_id;

        // Get active academic year
        const activeAcademicYear = await AcademicYear.findOne({ where: { status: 'Active' } });

        // Validation: Must complete personal details first
        const student = await Student.findOne({ 
            where: { 
                user_id: String(userId),
                academic_year: String(activeAcademicYear.id)
            } 
        });
        if (!student) {
            req.flash('error', 'Student record not found.');
            return res.redirect('/student/dashboard');
        }

        // Check if already approved
        if (student.admission_status === 'Approved') {
            req.flash('error', 'Your application has already been approved and cannot be edited.');
            return res.redirect('/student/dashboard');
        }

        // Check if already submitted
        if (student.declaration_status === '1') {
            req.flash('error', 'Your application has already been submitted and cannot be edited.');
            return res.redirect('/student/dashboard');
        }

        if (student.personal_status !== '1') {
            req.flash('error', 'Please complete personal details first.');
            return res.redirect('/student/registration#personal');
        }

        const {
            correspondence_address, correspondence_state, correspondence_district, correspondence_pincode, correspondence_tehsil,
            permanent_address, permanent_state, permanent_district, permanent_pincode, permanent_tehsil,
            local_guadian, local_guadian_address, guadian_contact
        } = req.body;

        // Validation for Guardian Contact Number
        if (guadian_contact) {
            if (!/^[0-9]{10}$/.test(guadian_contact)) {
                req.flash('error', 'Guardian contact number must be a 10-digit number.');
                req.flash('oldInput', req.body);
                return res.redirect('/student/registration?tab=address');
            }
            
            if (/^(\d)\1{9}$/.test(guadian_contact)) {
                req.flash('error', 'Guardian contact number cannot be a repetitive sequence (e.g., 0000000000).');
                req.flash('oldInput', req.body);
                return res.redirect('/student/registration?tab=address');
            }
        }

        await student.update({
            mailing_address: correspondence_address,
            mailing_state: correspondence_state,
            mailing_district: correspondence_district,
            mailing_tehsil: correspondence_tehsil,
            mailing_pincode: correspondence_pincode,
            permanent_address,
            permanent_state,
            permanent_district,
            permanent_tehsil,
            permanent_pincode,
            address_status: '1',
            local_guadian,
            local_guadian_address,
            guadian_contact
        });

        flashSuccessAndRedirect(req, res, 'Address details saved successfully.', '/student/registration?tab=educational');
    } catch (error) {
        req.flash('oldInput', req.body);
        handleError(req, res, error, 'An error occurred while saving address details.', '/student/registration');
    }
};

export const educationalDetailsPost = async (req, res) => {
    try {
        const userId = req.session.admission_user_id;

        // Get active academic year
        const activeAcademicYear = await AcademicYear.findOne({ where: { status: 'Active' } });

        // Validation: Must complete address details first
        const student = await Student.findOne({ 
            where: { 
                user_id: String(userId),
                academic_year: String(activeAcademicYear.id)
            } 
        });
        if (!student) {
            req.flash('error', 'Student record not found.');
            return res.redirect('/student/dashboard');
        }

        // Check if already approved
        if (student.admission_status === 'Approved') {
            req.flash('error', 'Your application has already been approved and cannot be edited.');
            return res.redirect('/student/dashboard');
        }

        // Check if already submitted
        if (student.declaration_status === '1') {
            req.flash('error', 'Your application has already been submitted and cannot be edited.');
            return res.redirect('/student/dashboard');
        }

        if (student.address_status !== '1') {
            req.flash('error', 'Please complete address details first.');
            return res.redirect('/student/registration#address');
        }

        const { board, year, percentage, roll_no, qual_name, mark_type, cgpa, total_marks, obtained_marks, subject_details } = req.body;
        console.log('DEBUG: educationalDetailsPost req.body:', JSON.stringify(req.body, null, 2));

        // Delete existing records to replace them (scoped to current session user_id)
        await Educational.destroy({ where: { user_id: String(userId) } });

        const educationRecords = [];
        if (board) {
            for (const qualId in board) {
                if (board[qualId] && board[qualId].trim() !== '') {
                    educationRecords.push({
                        user_id: String(userId),
                        registration_no: student.registration_no,
                        class_name: qualId,
                        school_name: qual_name[qualId], // Using school_name to store qualification name as requested
                        board_name: board[qualId],
                        year_of_passing: year[qualId],
                        percentage: (total_marks && obtained_marks && total_marks[qualId] && obtained_marks[qualId]) 
                            ? ((parseFloat(obtained_marks[qualId]) / parseFloat(total_marks[qualId])) * 100).toFixed(2)
                            : null,
                        cgpa: null,
                        mark_type: 'Percentage',
                        total_marks: total_marks ? total_marks[qualId] : null,
                        obtained_marks: obtained_marks ? obtained_marks[qualId] : null,
                        roll_no: roll_no[qualId],
                        subject_details: subject_details ? subject_details[qualId] : null
                    });
                }
            }
            console.log('DEBUG: educationRecords to be saved:', JSON.stringify(educationRecords, null, 2));
        }

        if (educationRecords.length > 0) {
            await Educational.bulkCreate(educationRecords);
        }

        await Student.update(
            { educational_status: '1' },
            { 
                where: { 
                    user_id: String(userId),
                    academic_year: String(activeAcademicYear.id)
                } 
            }
        );

        flashSuccessAndRedirect(req, res, 'Educational details saved successfully.', '/student/registration?tab=subject');
    } catch (error) {
        req.flash('oldInput', req.body);
        handleError(req, res, error, 'An error occurred while saving educational details.', '/student/registration');
    }
};

export const subjectDetailsPost = async (req, res) => {
    try {
        const userId = req.session.admission_user_id;
        const { major1_id, major2_id, minor_id, research_project_id, skill_id, cocurricular_id } = req.body;

        // Get active academic year
        const activeAcademicYear = await AcademicYear.findOne({ where: { status: 'Active' } });

        const student = await Student.findOne({ 
            where: { 
                user_id: String(userId),
                academic_year: String(activeAcademicYear.id)
            } 
        });
        if (!student) {
            req.flash('error', 'Student record not found.');
            return res.redirect('/student/dashboard');
        }

        // Check if already approved
        if (student.admission_status === 'Approved') {
            req.flash('error', 'Your application has already been approved and cannot be edited.');
            return res.redirect('/student/dashboard');
        }

        // Check if already submitted
        if (student.declaration_status === '1') {
            req.flash('error', 'Your application has already been submitted and cannot be edited.');
            return res.redirect('/student/dashboard');
        }

        const updateData = {
            subject_status: '1',
            major1_id: major1_id || null,
            major2_id: major2_id || null,
            minor_id: minor_id || null,
            research_project_id: research_project_id || null,
            skill_id: skill_id || null,
            cocurricular_id: cocurricular_id || null
        };

        await Student.update(
            updateData,
            {
                where: { 
                    user_id: String(userId),
                    academic_year: String(activeAcademicYear.id)
                },
                order: [['created_at', 'DESC']],
                limit: 1
            }
        );

        flashSuccessAndRedirect(req, res, 'Subject details saved successfully.', '/student/registration?tab=other');
    } catch (error) {
        req.flash('oldInput', req.body);
        handleError(req, res, error, 'An error occurred while saving subject details.', '/student/registration');
    }
};

export const otherDetailsPost = async (req, res) => {
    try {
        const userId = req.session.admission_user_id;

        // Get active academic year
        const activeAcademicYear = await AcademicYear.findOne({ where: { status: 'Active' } });

        // Validation
        const student = await Student.findOne({ 
            where: { 
                user_id: String(userId),
                academic_year: String(activeAcademicYear.id)
            },
            include: [{ model: Semester, as: 'semsterName' }]
        });
        if (!student) {
            req.flash('error', 'Student record not found.');
            return res.redirect('/student/dashboard');
        }

        // Check if already approved
        if (student.admission_status === 'Approved') {
            req.flash('error', 'Your application has already been approved and cannot be edited.');
            return res.redirect('/student/dashboard');
        }

        // Check if already submitted
        if (student.declaration_status === '1') {
            req.flash('error', 'Your application has already been submitted and cannot be edited.');
            return res.redirect('/student/dashboard');
        }

        if (student.subject_status !== '1') {
            req.flash('error', 'Please complete subject details first.');
            return res.redirect('/student/registration#subject');
        }

        const {
            father_occupation, mother_occupation, family_annual_income, income_certificate_no,
            computer_literate, extracurricular_activity, is_previous_student,
            disability_percentage, year_gap, year_gap_after_inter, gap_reason
        } = req.body;

        // Update Student
        await student.update({
            father_occupation,
            mother_occupation,
            family_annual_income,
            income_certificate_no,
            computer_literate,
            extracurricular_activity,
            is_previous_student,
            disability_percentage,
            year_gap,
            year_gap_after_inter,
            gap_reason,
            additional_status: '1'
        });

        const semOrder = student.semsterName ? parseInt(student.semsterName.order) : 0;
        const isReRegistration = semOrder > 1;
        const nextTab = isReRegistration ? 'photo' : 'weightage';

        flashSuccessAndRedirect(req, res, 'Other details saved successfully.', `/student/registration?tab=${nextTab}`);
    } catch (error) {
        req.flash('oldInput', req.body);
        handleError(req, res, error, 'An error occurred while saving other details.', '/student/registration');
    }
};

export const weightageDetailsPost = async (req, res) => {
    try {
        const userId = req.session.admission_user_id;

        // Get active academic year
        const activeAcademicYear = await AcademicYear.findOne({ where: { status: 'Active' } });

        // Validation: Must complete subject details first
        const student = await Student.findOne({ 
            where: { 
                user_id: String(userId),
                academic_year: String(activeAcademicYear.id)
            } 
        });
        if (!student) {
            req.flash('error', 'Student record not found.');
            return res.redirect('/student/dashboard');
        }

        // Check if already approved
        if (student.admission_status === 'Approved') {
            req.flash('error', 'Your application has already been approved and cannot be edited.');
            return res.redirect('/student/dashboard');
        }

        // Check if already submitted
        if (student.declaration_status === '1') {
            req.flash('error', 'Your application has already been submitted and cannot be edited.');
            return res.redirect('/student/dashboard');
        }

        if (student.subject_status !== '1') {
            req.flash('error', 'Please complete subject details first.');
            return res.redirect('/student/registration#subject');
        }

        const { weightage_ids } = req.body;
        console.log('DEBUG: weightageDetailsPost weightage_ids:', JSON.stringify(weightage_ids, null, 2));

        // Delete existing selections (scoped to current session user_id)
        await StudentWeightage.destroy({ where: { user_id: String(userId) } });

        const weightageJson = {};
        if (weightage_ids && Array.isArray(weightage_ids)) {
            const weightageRecords = [];
            weightage_ids.forEach(weightageId => {
                weightageRecords.push({
                    user_id: String(userId),
                    registration_no: student.registration_no,
                    weightage_id: weightageId,
                    status: true
                });
                weightageJson[weightageId] = "1";
            });
            if (weightageRecords.length > 0) {
                await StudentWeightage.bulkCreate(weightageRecords);
            }
        } else if (weightage_ids) {
            // Handle single checkbox case (not common but possible for one item)
            await StudentWeightage.create({
                user_id: String(userId),
                registration_no: student.registration_no,
                weightage_id: weightage_ids,
                status: true
            });
            weightageJson[weightage_ids] = "1";
        }

        await Student.update(
            { weightage: weightageJson, weightage_status: '1' },
            {
                where: { 
                    user_id: String(userId),
                    academic_year: String(activeAcademicYear.id)
                },
                order: [['created_at', 'DESC']],
                limit: 1
            }
        );

        flashSuccessAndRedirect(req, res, 'Weightage details saved successfully.', '/student/registration?tab=photo');
    } catch (error) {
        req.flash('oldInput', req.body);
        handleError(req, res, error, 'An error occurred while saving weightage details.', '/student/registration');
    }
};

export const photoSignPost = async (req, res) => {
    try {
        const userId = req.session.admission_user_id;

        // Get active academic year
        const activeAcademicYear = await AcademicYear.findOne({ where: { status: 'Active' } });

        // Validation: Must complete weightage details first
        const student = await Student.findOne({ 
            where: { 
                user_id: String(userId),
                academic_year: String(activeAcademicYear.id)
            },
            include: [{ model: Semester, as: 'semsterName' }]
        });
        if (!student) {
            req.flash('error', 'Student record not found.');
            return res.redirect('/student/dashboard');
        }

        // Check if already approved
        if (student.admission_status === 'Approved') {
            req.flash('error', 'Your application has already been approved and cannot be edited.');
            return res.redirect('/student/dashboard');
        }

        // Check if already submitted
        if (student.declaration_status === '1') {
            req.flash('error', 'Your application has already been submitted and cannot be edited.');
            return res.redirect('/student/dashboard');
        }

        const semOrder = student.semsterName ? parseInt(student.semsterName.order) : 0;
        const isReRegistration = semOrder > 1;

        if (!isReRegistration && student.weightage_status !== '1') {
            req.flash('error', 'Please complete weightage details first.');
            return res.redirect('/student/registration#weightage');
        }

        const updateData = { photographsign_status: '1' };
        const { StudentDocument, DocumentType, CourseSemesterDocument } = await import('../models/index.js');

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const docTypeCode = file.fieldname;
                const docType = await DocumentType.findOne({ where: { code: docTypeCode } });
                
                if (docType) {
                    const filePath = file.location || file.path || file.filename;
                    const storageType = file.location ? 'S3' : 'Local';

                    // Find if document already exists to delete old one (as requested)
                    const oldDoc = await StudentDocument.findOne({
                        where: {
                            student_id: student.id,
                            document_type_id: docType.id,
                            semester_id: student.year
                        }
                    });

                    if (oldDoc) {
                        try {
                            if (oldDoc.storage_type === 'S3') {
                                const { s3, DeleteObjectCommand } = await import('../middleware/uploadMiddleware.js');
                                const key = getS3Key(oldDoc.file_path);
                                if (key) {
                                    await s3.send(new DeleteObjectCommand({
                                        Bucket: process.env.AWS_BUCKET_NAME,
                                        Key: key
                                    }));
                                    console.log(`Deleted old S3 file: ${key}`);
                                }
                            } else {
                                const fullPath = path.join(process.cwd(), 'public', oldDoc.file_path);
                                if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
                            }
                        } catch (e) { console.error('Old file deletion failed:', e); }
                        
                        await oldDoc.update({
                            file_path: filePath,
                            storage_type: storageType,
                            academic_year: student.academic_year
                        });
                    } else {
                        await StudentDocument.create({
                            student_id: student.id,
                            registration_no: student.registration_no,
                            document_type_id: docType.id,
                            file_path: filePath,
                            storage_type: storageType,
                            academic_year: student.academic_year,
                            semester_id: student.year
                        });
                    }

                    // Backward compatibility for photo/sign columns
                    if (docTypeCode === 'photo') {
                        updateData.photo = filePath;
                    } else if (docTypeCode === 'signature' || docTypeCode === 'sign') {
                        updateData.sign = filePath;
                    }
                }
            }
        }

        await Student.update(
            updateData,
            {
                where: { 
                    user_id: String(userId),
                    academic_year: String(activeAcademicYear.id)
                },
                order: [['created_at', 'DESC']],
                limit: 1
            }
        );

        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({ success: true, message: 'Documents uploaded successfully.' });
        }

        flashSuccessAndRedirect(req, res, 'Documents uploaded successfully.', '/student/registration?tab=declaration');
    } catch (error) {
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(500).json({ success: false, message: error.message });
        }
        handleError(req, res, error, 'An error occurred while saving documents.', '/student/registration');
    }
};

export const declarationPost = async (req, res) => {
    try {
        const userId = req.session.admission_user_id;

        // Get active academic year
        const activeAcademicYear = await AcademicYear.findOne({ where: { status: 'Active' } });

        // Validation: Must complete photo & sign first
        const student = await Student.findOne({ 
            where: { 
                user_id: String(userId),
                academic_year: String(activeAcademicYear.id)
            } 
        });
        if (!student) {
            req.flash('error', 'Student record not found.');
            return res.redirect('/student/dashboard');
        }

        // Check if already approved
        if (student.admission_status === 'Approved') {
            req.flash('error', 'Your application has already been approved and cannot be edited.');
            return res.redirect('/student/dashboard');
        }

        // Check if already submitted
        if (student.declaration_status === '1') {
            req.flash('error', 'Your application has already been submitted and cannot be edited.');
            return res.redirect('/student/dashboard');
        }

        if (student.photographsign_status !== '1') {
            req.flash('error', 'Please complete photo & sign upload first.');
            return res.redirect('/student/registration#photo');
        }

        const { declaration } = req.body;

        if (!declaration) {
            return flashErrorAndRedirect(req, res, 'Please accept the declaration.', '/student/registration?tab=declaration');
        }

        await Student.update(
            { declaration_status: '1' },
            { 
                where: { 
                    user_id: String(userId),
                    academic_year: String(activeAcademicYear.id)
                } 
            }
        );

        flashSuccessAndRedirect(req, res, 'Registration completed successfully!', '/student/dashboard');
    } catch (error) {
        handleError(req, res, error, 'An error occurred while completing registration.', '/student/registration');
    }
};

export const printApplicationForm = async (req, res) => {
    try {
        const userId = req.session.admission_user_id;
        const activeAcademicYear = await AcademicYear.findOne({ where: { status: 'Active' } });

        let Payment;
        try {
            const models = await import('../models/index.js');
            Payment = models.Payment;
        } catch (e) { }


        const student = await Student.findOne({
            where: { user_id: String(userId), academic_year: String(activeAcademicYear.id) },
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
                { 
                    model: await (async () => { const m = await import('../models/index.js'); return m.StudentDocument; })(), 
                    as: 'documents',
                    include: [{ model: await (async () => { const m = await import('../models/index.js'); return m.DocumentType; })(), as: 'documentType' }]
                }
            ]
        });

        if (!student) {
            req.flash('error', 'Student record not found.');
            return res.redirect('/student/dashboard');
        }

        // Fetch previous student record for photo/sign fallback if needed (re-registration)
        const semOrder = student.semsterName ? parseInt(student.semsterName.order) : 0;
        const isReRegistration = semOrder > 1;
        let previousStudent = null;
        if (isReRegistration && (!student.photo || !student.sign)) {
            const { Op } = await import('sequelize');
            previousStudent = await Student.findOne({
                where: {
                    student_id: student.student_id,
                    academic_year: { [Op.ne]: String(activeAcademicYear.id) }
                },
                order: [['created_at', 'DESC']]
            });
            
            // Apply fallback to student object for view
            if (!student.photo && previousStudent) student.photo = previousStudent.photo;
            if (!student.sign && previousStudent) student.sign = previousStudent.sign;
            
            console.log('Applied photo/sign fallback from previousStudent:', previousStudent ? previousStudent.id : 'None');
        }

        const educationals = await Educational.findAll({
            where: { registration_no: student.registration_no },
            include: [{ model: Qualification, as: 'qualification' }]
        });

        const weightages = await Weightage.findAll();

        let payment = null;
        if (Payment) {
            payment = await Payment.findOne({
                where: { user_id: String(userId), status: 'Success' },
                order: [['created_at', 'DESC']]
            });
        }

        res.render('student_panel/admission/form_preview/registration_form_preview', {
            title: 'Print Application Form',
            student,
            user: student.user, // Add user for header
            activeAcademicYear, // Add academic year just in case
            educationals,
            weightages,
            payment,
            layout: 'student'
        });
    } catch (error) {
        handleError(req, res, error, 'An error occurred while loading application form for printing.', '/student/dashboard');
    }
};

export const printReceipt = async (req, res) => {
    try {
        const userId = req.session.admission_user_id;
        const activeAcademicYear = await AcademicYear.findOne({ where: { status: 'Active' } });

        const payment = await Payment.findOne({
            where: {
                user_id: String(userId),
                status: 'Success'
            }
        });

        if (!payment) {
            req.flash('error', 'Payment receipt not found.');
            return res.redirect('/student/dashboard');
        }

        // Redirect to the existing receipt page in PaymentController
        res.redirect(`/payment/receipt?transaction_id=${payment.transaction}`);
    } catch (error) {
        handleError(req, res, error, 'An error occurred while loading receipt.', '/student/dashboard');
    }
};
