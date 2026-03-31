import Semester from '../../models/Semester.js';
import Course from '../../models/Course.js';
import Qualification from '../../models/Qualification.js';
import SemesterQualification from '../../models/SemesterQualification.js';
import { handleError, flashValidationErrorsAndRender, flashErrorAndRedirect, flashSuccessAndRedirect } from '../../utils/responseHelper.js';
import { col, Op } from 'sequelize';
import Joi from 'joi';

const createCourseSemesterSchema = Joi.object({
  course_id: Joi.string().required(),
  semester_id: Joi.string().required(),
  status: Joi.string().valid('1', '0').optional(),
  registration_enabled: Joi.string().valid('1', '0').default('0'),
  fee_payment_enabled: Joi.string().valid('1', '0').default('0')
}).unknown(true);

const updateCourseSemesterSchema = Joi.object({
  course_id: Joi.string().required(),
  semester_id: Joi.string().required(),
  status: Joi.string().valid('1', '0').optional(),
  registration_enabled: Joi.string().valid('1', '0').default('0'),
  fee_payment_enabled: Joi.string().valid('1', '0').default('0')
}).unknown(true);

export const index = async (req, res) => {
  try {
    const { course_id } = req.query;

    const whereClause = {
      registration_enabled: 1
    };
    if (course_id) {
      whereClause.course_id = course_id;
    }

    const semesters = await Semester.findAll({
      where: whereClause,
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'name']
        },
        {
          model: SemesterQualification,
          as: 'qualifications',
          include: [{
            model: Qualification,
            as: 'qualification'
          }]
        }
      ],
      order: [[col('Semester.created_at'), 'DESC']],
      raw: false
    });

    // Get all courses for filter dropdown
    const courses = await Course.findAll({
      where: { status: '1' },
      order: [['name', 'ASC']]
    });

    res.render('admin_panel/course_semesters/index', {
      title: 'Registration Qualifications',
      courseSemesters: semesters,  // Keep variable name for view compatibility
      courses: courses,
      selectedCourseId: course_id || ''
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading course semesters.', '/admin/dashboard');
  }
};

export const create = async (req, res) => {
  try {
    const courses = await Course.findAll({
      where: { status: '1' },
      order: [['name', 'ASC']]
    });

    res.render('admin_panel/course_semesters/create', {
      title: 'Create Course Semester Qualifications',
      courses: courses
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the form.', '/admin/registration_qualifications');
  }
};

// API endpoint to get qualifications (classes)
export const getQualifications = async (req, res) => {
  try {
    const qualifications = await Qualification.findAll({
      where: { status: '1' },
      order: [['name', 'ASC']],
      attributes: ['id', 'name']
    });

    res.json({ qualifications: qualifications });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching qualifications.' });
  }
};

export const store = async (req, res) => {
  try {
    // Simplified qualification handling
    if (!bodyForValidation.qualifications) {
      delete bodyForValidation.qualifications;
    }

    const { error, value } = createCourseSemesterSchema.validate(bodyForValidation, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      const courses = await Course.findAll({
        where: { status: '1' },
        order: [['name', 'ASC']]
      });
      const semesters = await Semester.findAll({
        where: { status: 1 },
        order: [['order', 'ASC']]
      });
      return flashValidationErrorsAndRender(req, res, errors, 'admin_panel/course_semesters/create', {
        title: 'Create Course Semester Qualifications',
        courses: courses
      });
    }

    const { course_id, semester_id, status, registration_enabled, fee_payment_enabled } = value;

    // Find the semester and update its flags
    const semester = await Semester.findByPk(semester_id);

    if (!semester) {
      const courses = await Course.findAll({
        where: { status: '1' },
        order: [['name', 'ASC']]
      });
      return flashValidationErrorsAndRender(req, res, ['Semester not found.'], 'admin_panel/course_semesters/create', {
        title: 'Create Course Semester Qualifications',
        courses: courses
      });
    }

    // Verify the semester belongs to the selected course
    if (String(semester.course_id) !== String(course_id)) {
      const courses = await Course.findAll({
        where: { status: '1' },
        order: [['name', 'ASC']]
      });
      return flashValidationErrorsAndRender(req, res, ['Invalid course-semester combination.'], 'admin_panel/course_semesters/create', {
        title: 'Create Course Semester Qualifications',
        courses: courses
      });
    }

    // Update semester flags
    const { is_skill_required, is_cocurricular_required } = req.body;

    // Update semester flags (do NOT update global status)
    await semester.update({
      registration_enabled: registration_enabled !== undefined ? parseInt(registration_enabled) : 0,
      fee_payment_enabled: fee_payment_enabled !== undefined ? parseInt(fee_payment_enabled) : 0,
      is_skill_required: is_skill_required !== undefined ? parseInt(is_skill_required) : 0,
      is_cocurricular_required: is_cocurricular_required !== undefined ? parseInt(is_cocurricular_required) : 0
    });

    // Handle qualifications if provided
    if (req.body.qualifications && typeof req.body.qualifications === 'object') {
      const qualificationsToCreate = [];
      for (const key in req.body.qualifications) {
        const qual = req.body.qualifications[key];
        if (qual && qual.qualification_id && qual.required_optional_hidden) {
          qualificationsToCreate.push({
            semester_id: semester.id,
            qualification_id: parseInt(qual.qualification_id),
            required_optional_hidden: qual.required_optional_hidden,
            max_year_gap: qual.max_year_gap ? parseInt(qual.max_year_gap) : null
          });
        }
      }

      if (qualificationsToCreate.length > 0) {
        await SemesterQualification.bulkCreate(qualificationsToCreate);
      }
    }

    flashSuccessAndRedirect(req, res, 'Course Semester Qualifications created successfully.', '/admin/registration_qualifications');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while creating the course semester.', '/admin/registration_qualifications');
  }
};

export const edit = async (req, res) => {
  try {
    const { id } = req.params;
    const semester = await Semester.findByPk(id, {
      include: [
        {
          model: SemesterQualification,
          as: 'qualifications',
          include: [{
            model: Qualification,
            as: 'qualification'
          }]
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!semester) {
      req.flash('error', 'Semester not found.');
      return res.redirect('/admin/registration_qualifications');
    }

    const courses = await Course.findAll({
      where: { status: '1' },
      order: [['name', 'ASC']]
    });

    // Get all class names (qualifications)
    const qualifications = await Qualification.findAll({
      where: { status: '1' },
      order: [['name', 'ASC']]
    });

    // Create a map of existing qualifications and max year gaps
    const existingQualifications = {};
    const existingMaxYearGaps = {};
    if (semester.qualifications) {
      semester.qualifications.forEach(q => {
        existingQualifications[q.qualification_id] = q.required_optional_hidden;
        existingMaxYearGaps[q.qualification_id] = q.max_year_gap;
      });
    }

    // Get semester order to determine if it's odd (1,3,5) or even (2,4,6)
    const semesterOrder = semester ? parseInt(semester.order) : null;
    const isOddSemester = semesterOrder && [1, 3, 5].includes(semesterOrder);
    const isEvenSemester = semesterOrder && [2, 4, 6].includes(semesterOrder);

    res.render('admin_panel/course_semesters/edit', {
      title: 'Edit Course Semester Qualifications',
      courseSemester: semester,  // Keep variable name for view compatibility
      courses: courses,
      qualifications: qualifications,
      qualifications: qualifications,
      existingQualifications: existingQualifications,
      existingMaxYearGaps: existingMaxYearGaps,
      isOddSemester: isOddSemester,
      isEvenSemester: isEvenSemester,
      semesterOrder: semesterOrder
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the course semester.', '/admin/registration_qualifications');
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const semester = await Semester.findByPk(id);

    if (!semester) {
      return flashErrorAndRedirect(req, res, 'Semester not found.', '/admin/registration_qualifications');
    }

    // Remove _method from body before validation (method-override field)
    const bodyForValidation = { ...req.body };
    delete bodyForValidation._method;

    // Simplified qualification handling
    if (!bodyForValidation.qualifications) {
      delete bodyForValidation.qualifications;
    }

    // Normalize checkbox values (handle array ['0', '1'] case)
    if (Array.isArray(bodyForValidation.registration_enabled)) {
      bodyForValidation.registration_enabled = bodyForValidation.registration_enabled[bodyForValidation.registration_enabled.length - 1];
    }
    if (Array.isArray(bodyForValidation.fee_payment_enabled)) {
      bodyForValidation.fee_payment_enabled = bodyForValidation.fee_payment_enabled[bodyForValidation.fee_payment_enabled.length - 1];
    }

    const { error, value } = updateCourseSemesterSchema.validate(bodyForValidation, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      const courses = await Course.findAll({
        where: { status: '1' },
        order: [['name', 'ASC']]
      });
      const semesters = await Semester.findAll({
        where: { status: 1 },
        order: [['order', 'ASC']]
      });
      const qualifications = await Qualification.findAll({
        where: { status: '1' },
        order: [['name', 'ASC']]
      });
      const existingQualifications = {};
      // Populate existingQualifications from req.body to preserve user input
      if (req.body.qualifications) {
        for (const key in req.body.qualifications) {
          const q = req.body.qualifications[key];
          if (q && q.qualification_id) {
            existingQualifications[q.qualification_id] = q.required_optional_hidden;
          }
        }
      }

      const semesterOrder = semester ? parseInt(semester.order) : null;
      return flashValidationErrorsAndRender(req, res, errors, 'admin_panel/course_semesters/edit', {
        title: 'Edit Course Semester Qualifications',
        courseSemester: semester,
        courses: courses,
        qualifications: qualifications,
        existingQualifications: existingQualifications,
        isOddSemester: semesterOrder && [1, 3, 5].includes(semesterOrder),
        isEvenSemester: semesterOrder && [2, 4, 6].includes(semesterOrder),
        semesterOrder: semesterOrder,
        oldInput: req.body
      });
    }

    const { course_id, semester_id, status, registration_enabled, fee_payment_enabled } = value;

    // Verify the semester_id matches the ID being edited (semester cannot be changed)
    if (String(id) !== String(semester_id)) {
      return flashValidationErrorsAndRender(req, res, ['Cannot change semester ID. Please create a new entry instead.'], 'admin_panel/course_semesters/edit', {
        title: 'Edit Course Semester Qualifications',
        courseSemester: semester,
        courses: await Course.findAll({ where: { status: '1' }, order: [['name', 'ASC']] }),
        qualifications: await Qualification.findAll({ where: { status: '1' }, order: [['name', 'ASC']] }),
        existingQualifications: {},
        oldInput: req.body
      });
    }

    // Update semester flags
    const { is_skill_required, is_cocurricular_required } = req.body;

    // Update semester flags
    await semester.update({
      registration_enabled: registration_enabled !== undefined ? parseInt(registration_enabled) : 0,
      fee_payment_enabled: fee_payment_enabled !== undefined ? parseInt(fee_payment_enabled) : 0,
      is_skill_required: is_skill_required !== undefined ? parseInt(is_skill_required) : 0,
      is_cocurricular_required: is_cocurricular_required !== undefined ? parseInt(is_cocurricular_required) : 0
    });

    await semester.reload();

    // Handle qualifications if provided
    if (req.body.qualifications && typeof req.body.qualifications === 'object') {
      // Delete existing qualifications
      await SemesterQualification.destroy({
        where: { semester_id: id }
      });

      // Create new qualifications
      const qualificationsToCreate = [];
      for (const key in req.body.qualifications) {
        const qual = req.body.qualifications[key];
        if (qual && qual.qualification_id && qual.required_optional_hidden) {
          qualificationsToCreate.push({
            semester_id: parseInt(id),
            qualification_id: parseInt(qual.qualification_id),
            required_optional_hidden: qual.required_optional_hidden,
            max_year_gap: qual.max_year_gap ? parseInt(qual.max_year_gap) : null
          });
        }
      }

      if (qualificationsToCreate.length > 0) {
        await SemesterQualification.bulkCreate(qualificationsToCreate);
      }
    }

    flashSuccessAndRedirect(req, res, 'Course Semester Qualifications updated successfully.', '/admin/registration_qualifications');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while updating the course semester.', '/admin/registration_qualifications');
  }
};

export const destroy = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete semester qualifications for this semester
    await SemesterQualification.destroy({
      where: { semester_id: id }
    });

    // Also reset the semester flags to defaults
    const semester = await Semester.findByPk(id);
    if (semester) {
      await semester.update({
        status: 0,
        registration_enabled: 0,
        fee_payment_enabled: 0
      });
    }

    flashSuccessAndRedirect(req, res, 'Semester qualifications deleted successfully.', '/admin/registration_qualifications');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while deleting the semester qualifications.', '/admin/registration_qualifications');
  }
};

