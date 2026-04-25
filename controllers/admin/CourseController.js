import Course from '../../models/Course.js';
import CourseType from '../../models/CourseType.js';
import { generateSlug, generateUniqueSlug } from '../../utils/helpers.js';
import { createCourseSchema, updateCourseSchema } from '../../validations/courseValidation.js';
import { handleError, flashValidationErrorsAndRender, flashErrorAndRedirect, flashSuccessAndRedirect } from '../../utils/responseHelper.js';
import { Op, col } from 'sequelize';

export const index = async (req, res) => {
  try {
    const courses = await Course.findAll({
      include: [{
        model: CourseType,
        as: 'courseType'
      }],
      order: [[col('Course.created_at'), 'DESC']]
    });

    res.render('admin_panel/courses/index', {
      title: 'Courses',
      courses: courses
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading courses.', '/admin/dashboard');
  }
};

export const create = async (req, res) => {
  try {
    const courseType = await CourseType.findAll();

    res.render('admin_panel/courses/create', {
      title: 'Create Course',
      courseType: courseType
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the form.', '/admin/courses');
  }
};

export const store = async (req, res) => {
  try {
    const { error, value } = createCourseSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);

      const courseType = await CourseType.findAll();

      return flashValidationErrorsAndRender(req, res, errors, 'admin_panel/courses/create', {
        title: 'Create Course',
        courseType: courseType
      });
    }

    const { course_type_id, course_name, status } = value;
    const baseSlug = generateSlug(course_name);
    const slug = await generateUniqueSlug(Course, baseSlug);

    await Course.create({
      course_type_id: String(course_type_id),
      name: course_name,
      slug: slug,
      status: status
    });

    flashSuccessAndRedirect(req, res, 'Course created successfully.', '/admin/courses');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while creating the course.', '/admin/courses');
  }
};

export const edit = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);

    if (!course) {
      req.flash('error', 'Course not found.');
      return res.redirect('/admin/courses');
    }

    const courseType = await CourseType.findAll();

    res.render('admin_panel/courses/edit', {
      title: 'Edit Course',
      course: course,
      courseType: courseType
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the course.', '/admin/courses');
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);

    if (!course) {
      return flashErrorAndRedirect(req, res, 'Course not found.', '/admin/courses');
    }

    // Remove _method from body before validation (method-override field)
    const bodyForValidation = { ...req.body };
    delete bodyForValidation._method;

    const { error, value } = updateCourseSchema.validate(bodyForValidation, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      req.flash('errors', errors);
      return res.redirect(`/admin/courses/${id}/edit`);
    }

    const { course_type_id, course_name, status } = value;
    const baseSlug = generateSlug(course_name);
    const slug = await generateUniqueSlug(Course, baseSlug, id);

    await course.update({
      course_type_id: String(course_type_id),
      name: course_name,
      slug: slug,
      status: status
    })

    flashSuccessAndRedirect(req, res, 'Course updated successfully.', '/admin/courses');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while updating the course.', '/admin/courses');
  }
};

export const destroy = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);

    if (!course) {
      return flashErrorAndRedirect(req, res, 'Course not found.', '/admin/courses');
    }

    await course.destroy();
    flashSuccessAndRedirect(req, res, 'Course deleted successfully.', '/admin/courses');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while deleting the course.', '/admin/courses');
  }
};

