import Semester from '../../models/Semester.js';
import Course from '../../models/Course.js';
import { handleError, flashValidationErrorsAndRender, flashErrorAndRedirect, flashSuccessAndRedirect } from '../../utils/responseHelper.js';
import { generateSlug } from '../../utils/helpers.js';
import { col, Op } from 'sequelize';
import Joi from 'joi';

const createSemesterSchema = Joi.object({
  course_id: Joi.string().required(),
  name: Joi.string().required(),
  order: Joi.string().required(),
  status: Joi.alternatives().try(
    Joi.number().valid(1, 0),
    Joi.string().valid('1', '0')
  ).default(1),
  registration_enabled: Joi.alternatives().try(
    Joi.number().valid(1, 0),
    Joi.string().valid('1', '0'),
    Joi.array().items(Joi.string().valid('1', '0'), Joi.number().valid(1, 0))
  ).default('0'),
  fee_payment_enabled: Joi.alternatives().try(
    Joi.number().valid(1, 0),
    Joi.string().valid('1', '0'),
    Joi.array().items(Joi.string().valid('1', '0'), Joi.number().valid(1, 0))
  ).default('0'),
  approval_required: Joi.alternatives().try(
    Joi.number().valid(1, 0),
    Joi.string().valid('1', '0'),
    Joi.array().items(Joi.string().valid('1', '0'), Joi.number().valid(1, 0))
  ).default('0'),
  is_major1_enabled: Joi.alternatives().try(
    Joi.number().valid(1, 0),
    Joi.string().valid('1', '0'),
    Joi.array().items(Joi.string().valid('1', '0'), Joi.number().valid(1, 0))
  ).default('1'),
  is_major2_enabled: Joi.alternatives().try(
    Joi.number().valid(1, 0),
    Joi.string().valid('1', '0'),
    Joi.array().items(Joi.string().valid('1', '0'), Joi.number().valid(1, 0))
  ).default('1'),
  is_minor_enabled: Joi.alternatives().try(
    Joi.number().valid(1, 0),
    Joi.string().valid('1', '0'),
    Joi.array().items(Joi.string().valid('1', '0'), Joi.number().valid(1, 0))
  ).default('1'),
  is_research_project_enabled: Joi.alternatives().try(
    Joi.number().valid(1, 0),
    Joi.string().valid('1', '0'),
    Joi.array().items(Joi.string().valid('1', '0'), Joi.number().valid(1, 0))
  ).default('0')
});

const updateSemesterSchema = Joi.object({
  course_id: Joi.string().required(),
  name: Joi.string().required(),
  order: Joi.string().required(),
  status: Joi.alternatives().try(
    Joi.number().valid(1, 0),
    Joi.string().valid('1', '0')
  ).default(1),
  registration_enabled: Joi.alternatives().try(
    Joi.number().valid(1, 0),
    Joi.string().valid('1', '0'),
    Joi.array().items(Joi.string().valid('1', '0'), Joi.number().valid(1, 0))
  ).default('0'),
  fee_payment_enabled: Joi.alternatives().try(
    Joi.number().valid(1, 0),
    Joi.string().valid('1', '0'),
    Joi.array().items(Joi.string().valid('1', '0'), Joi.number().valid(1, 0))
  ).default('0'),
  approval_required: Joi.alternatives().try(
    Joi.number().valid(1, 0),
    Joi.string().valid('1', '0'),
    Joi.array().items(Joi.string().valid('1', '0'), Joi.number().valid(1, 0))
  ).default('0'),
  is_major1_enabled: Joi.alternatives().try(
    Joi.number().valid(1, 0),
    Joi.string().valid('1', '0'),
    Joi.array().items(Joi.string().valid('1', '0'), Joi.number().valid(1, 0))
  ).default('1'),
  is_major2_enabled: Joi.alternatives().try(
    Joi.number().valid(1, 0),
    Joi.string().valid('1', '0'),
    Joi.array().items(Joi.string().valid('1', '0'), Joi.number().valid(1, 0))
  ).default('1'),
  is_minor_enabled: Joi.alternatives().try(
    Joi.number().valid(1, 0),
    Joi.string().valid('1', '0'),
    Joi.array().items(Joi.string().valid('1', '0'), Joi.number().valid(1, 0))
  ).default('1'),
  is_research_project_enabled: Joi.alternatives().try(
    Joi.number().valid(1, 0),
    Joi.string().valid('1', '0'),
    Joi.array().items(Joi.string().valid('1', '0'), Joi.number().valid(1, 0))
  ).default('0')
});

export const index = async (req, res) => {
  try {
    // Get all courses for filter dropdown
    const courses = await Course.findAll({
      where: { status: '1' },
      order: [['name', 'ASC']]
    });

    // Get filter parameter
    const courseId = req.query.course_id;

    // Build where clause for filtering
    const whereClause = {};
    if (courseId) {
      whereClause.course_id = String(courseId);
    }

    const semesters = await Semester.findAll({
      where: whereClause,
      include: [{
        model: Course,
        as: 'course'
      }],
      order: [[col('Semester.created_at'), 'DESC']]
    });

    res.render('admin_panel/semesters/index', {
      title: 'Semesters',
      semesters: semesters,
      courses: courses,
      selectedCourseId: courseId || ''
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading semesters.', '/admin/dashboard');
  }
};

export const create = async (req, res) => {
  try {
    const courses = await Course.findAll({
      where: { status: '1' },
      order: [['name', 'ASC']]
    });

    res.render('admin_panel/semesters/create', {
      title: 'Create Semester',
      courses: courses
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the form.', '/admin/semesters');
  }
};

// Helper function to generate unique slug per course
const generateUniqueSlugForCourse = async (courseId, baseSlug, excludeId = null) => {
  let slug = baseSlug;
  let count = 0;

  const whereClause = excludeId
    ? {
        course_id: String(courseId),
        slug: { [Op.like]: `${slug}%` },
        id: { [Op.ne]: excludeId }
      }
    : {
        course_id: String(courseId),
        slug: { [Op.like]: `${slug}%` }
      };

  const existing = await Semester.findAll({ where: whereClause });
  count = existing.length;

  if (count > 0) {
    slug = `${baseSlug}-${count + 1}`;
  }

  return slug;
};

export const store = async (req, res) => {
  try {
    // Normalize checkbox values before validation
    const bodyForValidation = { ...req.body };

    // Handle arrays (when both hidden input and checkbox send values)
    if (Array.isArray(bodyForValidation.registration_enabled)) {
      bodyForValidation.registration_enabled = bodyForValidation.registration_enabled.includes('1') ? '1' : '0';
    } else if (!bodyForValidation.registration_enabled || bodyForValidation.registration_enabled === '') {
      bodyForValidation.registration_enabled = '0';
    }

    if (Array.isArray(bodyForValidation.fee_payment_enabled)) {
      bodyForValidation.fee_payment_enabled = bodyForValidation.fee_payment_enabled.includes('1') ? '1' : '0';
    } else if (!bodyForValidation.fee_payment_enabled || bodyForValidation.fee_payment_enabled === '') {
      bodyForValidation.fee_payment_enabled = '0';
    }

    if (Array.isArray(bodyForValidation.approval_required)) {
      bodyForValidation.approval_required = bodyForValidation.approval_required.includes('1') ? '1' : '0';
    } else if (!bodyForValidation.approval_required || bodyForValidation.approval_required === '') {
      bodyForValidation.approval_required = '0';
    }

    // Subject Flags
    if (Array.isArray(bodyForValidation.is_major1_enabled)) {
      bodyForValidation.is_major1_enabled = bodyForValidation.is_major1_enabled.includes('1') ? '1' : '0';
    } else if (bodyForValidation.is_major1_enabled === undefined) {
      bodyForValidation.is_major1_enabled = '0';
    }

    if (Array.isArray(bodyForValidation.is_major2_enabled)) {
      bodyForValidation.is_major2_enabled = bodyForValidation.is_major2_enabled.includes('1') ? '1' : '0';
    } else if (bodyForValidation.is_major2_enabled === undefined) {
      bodyForValidation.is_major2_enabled = '0';
    }

    if (Array.isArray(bodyForValidation.is_minor_enabled)) {
      bodyForValidation.is_minor_enabled = bodyForValidation.is_minor_enabled.includes('1') ? '1' : '0';
    } else if (bodyForValidation.is_minor_enabled === undefined) {
      bodyForValidation.is_minor_enabled = '0';
    }

    if (Array.isArray(bodyForValidation.is_research_project_enabled)) {
      bodyForValidation.is_research_project_enabled = bodyForValidation.is_research_project_enabled.includes('1') ? '1' : '0';
    } else if (bodyForValidation.is_research_project_enabled === undefined) {
      bodyForValidation.is_research_project_enabled = '0';
    }

    const { error, value } = createSemesterSchema.validate(bodyForValidation, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      const courses = await Course.findAll({
        where: { status: '1' },
        order: [['name', 'ASC']]
      });

      return flashValidationErrorsAndRender(req, res, errors, 'admin_panel/semesters/create', {
        title: 'Create Semester',
        courses: courses
      });
    }

    const { course_id, name, order, status, registration_enabled, fee_payment_enabled, approval_required } = value;

    // Convert to integers for comparison
    const regEnabled = registration_enabled === '1' || registration_enabled === 1 ? 1 : 0;
    const feeEnabled = fee_payment_enabled === '1' || fee_payment_enabled === 1 ? 1 : 0;
    const appRequired = approval_required === '1' || approval_required === 1 ? 1 : 0;
    
    const major1Enabled = value.is_major1_enabled === '1' || value.is_major1_enabled === 1 ? 1 : 0;
    const major2Enabled = value.is_major2_enabled === '1' || value.is_major2_enabled === 1 ? 1 : 0;
    const minorEnabled = value.is_minor_enabled === '1' || value.is_minor_enabled === 1 ? 1 : 0;
    const researchProjectEnabled = value.is_research_project_enabled === '1' || value.is_research_project_enabled === 1 ? 1 : 0;

    // Check if order already exists for this course
    const existingOrder = await Semester.findOne({
      where: {
        course_id: String(course_id),
        order: String(order)
      }
    });

    if (existingOrder) {
      const courses = await Course.findAll({
        where: { status: '1' },
        order: [['name', 'ASC']]
      });

      return flashValidationErrorsAndRender(req, res, ['This order number already exists for the selected course.'], 'admin_panel/semesters/create', {
        title: 'Create Semester',
        courses: courses
      });
    }

    // Ensure the same semester cannot have both registration and fee payment enabled
    if (regEnabled == 1 && feeEnabled == 1) {
      const courses = await Course.findAll({
        where: { status: '1' },
        order: [['name', 'ASC']]
      });

      return flashValidationErrorsAndRender(req, res, ['A semester cannot have both Registration and Fee Payment enabled at the same time. Please enable only one option.'], 'admin_panel/semesters/create', {
        title: 'Create Semester',
        courses: courses
      });
    }

    // Generate slug unique per course
    const baseSlug = generateSlug(name);
    const slug = await generateUniqueSlugForCourse(course_id, baseSlug);

    await Semester.create({
      course_id: String(course_id),
      name: name,
      slug: slug,
      order: String(order),
      status: status == '1' || status == 1 ? 1 : 0,
      registration_enabled: regEnabled,
      fee_payment_enabled: feeEnabled,
      approval_required: appRequired,
      is_major1_enabled: major1Enabled,
      is_major2_enabled: major2Enabled,
      is_minor_enabled: minorEnabled,
      is_research_project_enabled: researchProjectEnabled
    });

    flashSuccessAndRedirect(req, res, 'Semester created successfully.', '/admin/semesters');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while creating the semester.', '/admin/semesters');
  }
};

export const edit = async (req, res) => {
  try {
    const { id } = req.params;
    const semester = await Semester.findByPk(id);

    if (!semester) {
      req.flash('error', 'Semester not found.');
      return res.redirect('/admin/semesters');
    }

    const courses = await Course.findAll({
      where: { status: '1' },
      order: [['name', 'ASC']]
    });

    res.render('admin_panel/semesters/edit', {
      title: 'Edit Semester',
      semester: semester,
      courses: courses
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the semester.', '/admin/semesters');
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const semester = await Semester.findByPk(id);

    if (!semester) {
      return flashErrorAndRedirect(req, res, 'Semester not found.', '/admin/semesters');
    }

    // Remove _method from body before validation (method-override field)
    const bodyForValidation = { ...req.body };
    delete bodyForValidation._method;

    // Normalize checkbox values before validation
    // Handle arrays (when both hidden input and checkbox send values)
    if (Array.isArray(bodyForValidation.registration_enabled)) {
      bodyForValidation.registration_enabled = bodyForValidation.registration_enabled.includes('1') ? '1' : '0';
    } else if (!bodyForValidation.registration_enabled || bodyForValidation.registration_enabled === '') {
      bodyForValidation.registration_enabled = '0';
    }

    if (Array.isArray(bodyForValidation.fee_payment_enabled)) {
      bodyForValidation.fee_payment_enabled = bodyForValidation.fee_payment_enabled.includes('1') ? '1' : '0';
    } else if (!bodyForValidation.fee_payment_enabled || bodyForValidation.fee_payment_enabled === '') {
      bodyForValidation.fee_payment_enabled = '0';
    }

    if (Array.isArray(bodyForValidation.approval_required)) {
      bodyForValidation.approval_required = bodyForValidation.approval_required.includes('1') ? '1' : '0';
    } else if (!bodyForValidation.approval_required || bodyForValidation.approval_required === '') {
      bodyForValidation.approval_required = '0';
    }

    // Subject Flags
    if (Array.isArray(bodyForValidation.is_major1_enabled)) {
      bodyForValidation.is_major1_enabled = bodyForValidation.is_major1_enabled.includes('1') ? '1' : '0';
    } else if (bodyForValidation.is_major1_enabled === undefined) {
      bodyForValidation.is_major1_enabled = '0';
    }

    if (Array.isArray(bodyForValidation.is_major2_enabled)) {
      bodyForValidation.is_major2_enabled = bodyForValidation.is_major2_enabled.includes('1') ? '1' : '0';
    } else if (bodyForValidation.is_major2_enabled === undefined) {
      bodyForValidation.is_major2_enabled = '0';
    }

    if (Array.isArray(bodyForValidation.is_minor_enabled)) {
      bodyForValidation.is_minor_enabled = bodyForValidation.is_minor_enabled.includes('1') ? '1' : '0';
    } else if (bodyForValidation.is_minor_enabled === undefined) {
      bodyForValidation.is_minor_enabled = '0';
    }

    if (Array.isArray(bodyForValidation.is_research_project_enabled)) {
      bodyForValidation.is_research_project_enabled = bodyForValidation.is_research_project_enabled.includes('1') ? '1' : '0';
    } else if (bodyForValidation.is_research_project_enabled === undefined) {
      bodyForValidation.is_research_project_enabled = '0';
    }

    const { error, value } = updateSemesterSchema.validate(bodyForValidation, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      req.flash('errors', errors);
      return res.redirect(`/admin/semesters/${id}/edit`);
    }

    const { course_id, name, order, status, registration_enabled, fee_payment_enabled, approval_required } = value;

    // Convert string values to numbers for checkbox fields
    const regEnabled = registration_enabled === '1' || registration_enabled === 1 ? 1 : 0;
    const feeEnabled = fee_payment_enabled === '1' || fee_payment_enabled === 1 ? 1 : 0;
    const appRequired = approval_required === '1' || approval_required === 1 ? 1 : 0;

    const major1Enabled = value.is_major1_enabled === '1' || value.is_major1_enabled === 1 ? 1 : 0;
    const major2Enabled = value.is_major2_enabled === '1' || value.is_major2_enabled === 1 ? 1 : 0;
    const minorEnabled = value.is_minor_enabled === '1' || value.is_minor_enabled === 1 ? 1 : 0;
    const researchProjectEnabled = value.is_research_project_enabled === '1' || value.is_research_project_enabled === 1 ? 1 : 0;

    // Check if order already exists for this course (excluding current semester)
    const existingOrder = await Semester.findOne({
      where: {
        course_id: String(course_id),
        order: String(order),
        id: { [Op.ne]: id }
      }
    });

    if (existingOrder) {
      const errors = ['This order number already exists for the selected course.'];
      req.flash('errors', errors);
      return res.redirect(`/admin/semesters/${id}/edit`);
    }

    // Ensure the same semester cannot have both registration and fee payment enabled
    if (regEnabled == 1 && feeEnabled == 1) {
      const errors = ['A semester cannot have both Registration and Fee Payment enabled at the same time. Please enable only one option.'];
      req.flash('errors', errors);
      return res.redirect(`/admin/semesters/${id}/edit`);
    }

    // Generate slug unique per course
    const baseSlug = generateSlug(name);
    const slug = await generateUniqueSlugForCourse(course_id, baseSlug, id);

    await semester.update({
      course_id: String(course_id),
      name: name,
      slug: slug,
      order: String(order),
      status: status == '1' || status == 1 ? 1 : 0,
      registration_enabled: regEnabled,
      fee_payment_enabled: feeEnabled,
      approval_required: appRequired,
      is_major1_enabled: major1Enabled,
      is_major2_enabled: major2Enabled,
      is_minor_enabled: minorEnabled,
      is_research_project_enabled: researchProjectEnabled
    });

    flashSuccessAndRedirect(req, res, 'Semester updated successfully.', '/admin/semesters');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while updating the semester.', '/admin/semesters');
  }
};

export const destroy = async (req, res) => {
  try {
    const { id } = req.params;
    const semester = await Semester.findByPk(id);

    if (!semester) {
      return flashErrorAndRedirect(req, res, 'Semester not found.', '/admin/semesters');
    }

    await semester.destroy();
    flashSuccessAndRedirect(req, res, 'Semester deleted successfully.', '/admin/semesters');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while deleting the semester.', '/admin/semesters');
  }
};
