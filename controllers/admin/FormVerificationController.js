import Student from '../../models/Student.js';
import User from '../../models/User.js';
import Course from '../../models/Course.js';
import Educational from '../../models/Educational.js';
import Qualification from '../../models/Qualification.js';
import Semester from '../../models/Semester.js';
import Subject from '../../models/Subject.js';
import Skills from '../../models/Skills.js';
import Cocurricular from '../../models/Cocurricular.js';
import Weightage from '../../models/Weightage.js';
import AcademicYear from '../../models/AcademicYear.js';
import StudentWeightage from '../../models/StudentWeightage.js';
import { handleError, flashSuccessAndRedirect, flashErrorAndRedirect } from '../../utils/responseHelper.js';
import { Op } from 'sequelize';

export const index = async (req, res) => {
  try {
    const { registration_no, academic_year_id } = req.query;

    // Get all academic years for the filter dropdown
    const academicYears = await AcademicYear.findAll({ order: [['session', 'DESC']] });
    const activeYear = await AcademicYear.findOne({ where: { status: 'Active' } });
    const defaultYearId = activeYear ? activeYear.id : null;
    const currentYearId = academic_year_id || defaultYearId;

    if (registration_no) {
      // Find student by registration number and academic year with all associations
      const where = { registration_no: registration_no };
      if (currentYearId) {
        where.academic_year = String(currentYearId);
      }

      const student = await Student.findOne({
        where: where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'phone']
          },
          {
            model: Course,
            as: 'courseName',
            attributes: ['id', 'name']
          },
          {
            model: Semester,
            as: 'semsterName'
          },
          { model: Subject, as: 'major1' },
          { model: Subject, as: 'major2' },
          { model: Subject, as: 'minor' },
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
        req.flash('error', 'Student not found with the provided registration number.');
        return res.render('admin_panel/form_verification/index', {
          title: 'Form Verification',
          student: null,
          educationals: [],
          weightages: [],
          academicYears,
          activeYearId: currentYearId,
          notFinalized: false,
          registration_no: registration_no
        });
      }

      // Fetch educational details
      const educationals = await Educational.findAll({
        where: { user_id: String(student.user_id) },
        include: [{ model: Qualification, as: 'qualification' }]
      });

      // Fetch weightages
      const weightages = await Weightage.findAll();

      return res.render('admin_panel/form_verification/index', {
        title: 'Form Verification',
        student: student,
        educationals: educationals,
        weightages: weightages,
        academicYears,
        activeYearId: currentYearId,
        notFinalized: student.declaration_status !== '1'
      });
    }

    // Show search form if no registration number provided
    res.render('admin_panel/form_verification/index', {
      title: 'Form Verification',
      student: null,
      educationals: [],
      weightages: [],
      academicYears,
      activeYearId: currentYearId,
      notFinalized: false
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading form verification.', '/admin/dashboard');
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { registration_no } = req.params;
    const { admission_status } = req.body;

    // Validate admission status
    const validStatuses = ['Pending', 'Approved', 'Disapproved'];
    if (!validStatuses.includes(admission_status)) {
      return flashErrorAndRedirect(req, res, 'Invalid admission status.', `/admin/form_verification?registration_no=${registration_no}`);
    }

    // Find student by registration number
    const student = await Student.findOne({
      where: { registration_no: registration_no }
    });

    if (!student) {
      return flashErrorAndRedirect(req, res, 'Student not found.', '/admin/form_verification');
    }

    // Update admission status
    await student.update({
      admission_status: admission_status
    });

    flashSuccessAndRedirect(req, res, `Student admission status updated to ${admission_status} successfully.`, `/admin/form_verification?registration_no=${registration_no}`);
  } catch (error) {
    handleError(req, res, error, 'An error occurred while updating admission status.', '/admin/form_verification');
  }
};
