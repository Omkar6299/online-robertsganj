import Cocurricular from '../../models/Cocurricular.js';
import CourseType from '../../models/CourseType.js';
import Course from '../../models/Course.js';
import Semester from '../../models/Semester.js';
import { handleError, flashValidationErrorsAndRender, flashErrorAndRedirect, flashSuccessAndRedirect } from '../../utils/responseHelper.js';
import { col } from 'sequelize';
import Joi from 'joi';

const createCocurricularSchema = Joi.object({
  course_type_id: Joi.string().required(),
  course_id: Joi.string().required(),
  semester_id: Joi.string().required(),
  name: Joi.string().required(),
  status: Joi.string().valid('1', '0').default('1')
}).unknown(true);

const updateCocurricularSchema = Joi.object({
  course_type_id: Joi.string().required(),
  course_id: Joi.string().required(),
  semester_id: Joi.string().required(),
  name: Joi.string().required(),
  status: Joi.string().valid('1', '0').default('1')
}).unknown(true);

export const index = async (req, res) => {
  try {
    const cocurriculars = await Cocurricular.findAll({
      include: [
        {
          model: CourseType,
          as: 'courseType'
        },
        {
          model: Course,
          as: 'courseName'
        },
        {
          model: Semester,
          as: 'semsterName'
        }
      ],
      order: [[col('Cocurricular.created_at'), 'DESC']]
    });

    res.render('admin_panel/cocurricular/index', {
      title: 'Co-curricular Courses',
      cocurriculars: cocurriculars
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading co-curricular courses.', '/admin/dashboard');
  }
};

export const create = async (req, res) => {
  try {
    const courseTypes = await CourseType.findAll({
      where: { status: '1' },
      order: [['name', 'ASC']]
    });

    res.render('admin_panel/cocurricular/create', {
      title: 'Create Co-curricular Course',
      courseTypes: courseTypes
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the form.', '/admin/cocurricular');
  }
};

export const store = async (req, res) => {
  try {
    const { error, value } = createCocurricularSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      const courseTypes = await CourseType.findAll({
        where: { status: '1' },
        order: [['name', 'ASC']]
      });

      return flashValidationErrorsAndRender(req, res, errors, 'admin_panel/cocurricular/create', {
        title: 'Create Co-curricular Course',
        courseTypes: courseTypes
      });
    }

    const { course_type_id, course_id, semester_id, name, status } = value;

    await Cocurricular.create({
      course_type_id: String(course_type_id),
      course_id: course_id,
      semester_id: semester_id,
      name: name,
      status: status || '1'
    });

    flashSuccessAndRedirect(req, res, 'Co-curricular course created successfully.', '/admin/cocurricular');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while creating the co-curricular course.', '/admin/cocurricular');
  }
};

export const edit = async (req, res) => {
  try {
    const { id } = req.params;
    const cocurricular = await Cocurricular.findByPk(id);

    if (!cocurricular) {
      req.flash('error', 'Co-curricular course not found.');
      return res.redirect('/admin/cocurricular');
    }

    const courseTypes = await CourseType.findAll({
      where: { status: '1' },
      order: [['name', 'ASC']]
    });

    res.render('admin_panel/cocurricular/edit', {
      title: 'Edit Co-curricular Course',
      cocurricular: cocurricular,
      courseTypes: courseTypes
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the co-curricular course.', '/admin/cocurricular');
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const cocurricular = await Cocurricular.findByPk(id);

    if (!cocurricular) {
      return flashErrorAndRedirect(req, res, 'Co-curricular course not found.', '/admin/cocurricular');
    }

    const { error, value } = updateCocurricularSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      req.flash('errors', errors);
      return res.redirect(`/admin/cocurricular/${id}/edit`);
    }

    const { course_type_id, course_id, semester_id, name, status } = value;

    await cocurricular.update({
      course_type_id: String(course_type_id),
      course_id: course_id,
      semester_id: semester_id,
      name: name,
      status: status || '1'
    });

    flashSuccessAndRedirect(req, res, 'Co-curricular course updated successfully.', '/admin/cocurricular');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while updating the co-curricular course.', '/admin/cocurricular');
  }
};

export const destroy = async (req, res) => {
  try {
    const { id } = req.params;
    const cocurricular = await Cocurricular.findByPk(id);

    if (!cocurricular) {
      return flashErrorAndRedirect(req, res, 'Co-curricular course not found.', '/admin/cocurricular');
    }

    await cocurricular.destroy();
    flashSuccessAndRedirect(req, res, 'Co-curricular course deleted successfully.', '/admin/cocurricular');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while deleting the co-curricular course.', '/admin/cocurricular');
  }
};
