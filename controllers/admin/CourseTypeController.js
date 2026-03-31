import CourseType from '../../models/CourseType.js';
import { handleError, flashValidationErrorsAndRender, flashErrorAndRedirect, flashSuccessAndRedirect } from '../../utils/responseHelper.js';
import { col } from 'sequelize';
import Joi from 'joi';
import { generateSlug, generateUniqueSlug } from '../../utils/helpers.js';

const createCourseTypeSchema = Joi.object({
  name: Joi.string().required(),
  status: Joi.string().valid('1', '0').default('1')
});

const updateCourseTypeSchema = Joi.object({
  name: Joi.string().required(),
  status: Joi.string().valid('1', '0').required()
});

export const index = async (req, res) => {
  try {
    const courseTypes = await CourseType.findAll({
      order: [[col('CourseType.created_at'), 'DESC']],
      raw: true
    });

    res.render('admin_panel/course_types/index', {
      title: 'Course Types',
      courseTypes: courseTypes
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading course types.', '/admin/dashboard');
  }
};

export const create = async (req, res) => {
  try {
    res.render('admin_panel/course_types/create', {
      title: 'Create Course Type'
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the form.', '/admin/course_types');
  }
};

export const store = async (req, res) => {
  try {
    const { error, value } = createCourseTypeSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      return flashValidationErrorsAndRender(req, res, errors, 'admin_panel/course_types/create', {
        title: 'Create Course Type'
      });
    }

    const { name, status } = value;
    const baseSlug = generateSlug(name);
    const slug = await generateUniqueSlug(CourseType, baseSlug);

    await CourseType.create({
      name: name,
      slug: slug,
      status: status !== undefined ? status : '1'
    });

    flashSuccessAndRedirect(req, res, 'Course type created successfully.', '/admin/course_types');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while creating the course type.', '/admin/course_types');
  }
};

export const edit = async (req, res) => {
  try {
    const { id } = req.params;
    const courseType = await CourseType.findByPk(id);

    if (!courseType) {
      req.flash('error', 'Course type not found.');
      return res.redirect('/admin/course_types');
    }

    res.render('admin_panel/course_types/edit', {
      title: 'Edit Course Type',
      courseType: courseType
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the course type.', '/admin/course_types');
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const courseType = await CourseType.findByPk(id);

    if (!courseType) {
      return flashErrorAndRedirect(req, res, 'Course type not found.', '/admin/course_types');
    }

    // Remove _method from body before validation (method-override field)
    const bodyForValidation = { ...req.body };
    delete bodyForValidation._method;

    const { error, value } = updateCourseTypeSchema.validate(bodyForValidation, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      return flashValidationErrorsAndRender(req, res, errors, 'admin_panel/course_types/edit', {
        title: 'Edit Course Type',
        courseType: courseType,
        oldInput: req.body
      });
    }

    const { name, status } = value;
    const baseSlug = generateSlug(name);
    const slug = await generateUniqueSlug(CourseType, baseSlug, id);

    // Set values directly on the instance and save
    courseType.name = name;
    courseType.slug = slug;
    courseType.status = String(status); // Always convert to string, even if it's '0'

    // Use save() to ensure the value is persisted
    await courseType.save();

    // Reload from database to ensure we have the latest data
    await courseType.reload();

    flashSuccessAndRedirect(req, res, 'Course type updated successfully.', '/admin/course_types');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while updating the course type.', '/admin/course_types');
  }
};

export const destroy = async (req, res) => {
  try {
    const { id } = req.params;
    const courseType = await CourseType.findByPk(id);

    if (!courseType) {
      return flashErrorAndRedirect(req, res, 'Course type not found.', '/admin/course_types');
    }

    await courseType.destroy();
    flashSuccessAndRedirect(req, res, 'Course type deleted successfully.', '/admin/course_types');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while deleting the course type.', '/admin/course_types');
  }
};

