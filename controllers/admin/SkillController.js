import Skills from '../../models/Skills.js';
import CourseType from '../../models/CourseType.js';
import Course from '../../models/Course.js';
import Semester from '../../models/Semester.js';
import { handleError, flashValidationErrorsAndRender, flashErrorAndRedirect, flashSuccessAndRedirect } from '../../utils/responseHelper.js';
import { col } from 'sequelize';
import Joi from 'joi';

const createSkillSchema = Joi.object({
  course_type_id: Joi.string().required(),
  course_id: Joi.string().required(),
  semester_id: Joi.string().required(),
  name: Joi.string().required(),
  status: Joi.string().valid('1', '0').default('1')
}).unknown(true);

const updateSkillSchema = Joi.object({
  course_type_id: Joi.string().required(),
  course_id: Joi.string().required(),
  semester_id: Joi.string().required(),
  name: Joi.string().required(),
  status: Joi.string().valid('1', '0').default('1')
}).unknown(true);

export const index = async (req, res) => {
  try {
    const skills = await Skills.findAll({
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
      order: [[col('Skills.created_at'), 'DESC']]
    });

    res.render('admin_panel/skills/index', {
      title: 'Skills',
      skills: skills
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading skills.', '/admin/dashboard');
  }
};

export const create = async (req, res) => {
  try {
    const courseTypes = await CourseType.findAll({
      where: { status: '1' },
      order: [['name', 'ASC']]
    });

    res.render('admin_panel/skills/create', {
      title: 'Create Skill',
      courseTypes: courseTypes
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the form.', '/admin/skills');
  }
};

export const store = async (req, res) => {
  try {
    const { error, value } = createSkillSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      const courseTypes = await CourseType.findAll({
        where: { status: '1' },
        order: [['name', 'ASC']]
      });

      return flashValidationErrorsAndRender(req, res, errors, 'admin_panel/skills/create', {
        title: 'Create Skill',
        courseTypes: courseTypes
      });
    }

    const { course_type_id, course_id, semester_id, name, status } = value;

    await Skills.create({
      course_type_id: String(course_type_id),
      course_id: course_id,
      semester_id: semester_id,
      name: name,
      status: status || '1'
    });

    flashSuccessAndRedirect(req, res, 'Skill created successfully.', '/admin/skills');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while creating the skill.', '/admin/skills');
  }
};

export const edit = async (req, res) => {
  try {
    const { id } = req.params;
    const skill = await Skills.findByPk(id);

    if (!skill) {
      req.flash('error', 'Skill not found.');
      return res.redirect('/admin/skills');
    }

    const courseTypes = await CourseType.findAll({
      where: { status: '1' },
      order: [['name', 'ASC']]
    });

    res.render('admin_panel/skills/edit', {
      title: 'Edit Skill',
      skill: skill,
      courseTypes: courseTypes
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the skill.', '/admin/skills');
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const skill = await Skills.findByPk(id);

    if (!skill) {
      return flashErrorAndRedirect(req, res, 'Skill not found.', '/admin/skills');
    }

    const { error, value } = updateSkillSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      req.flash('errors', errors);
      return res.redirect(`/admin/skills/${id}/edit`);
    }

    const { course_type_id, course_id, semester_id, name, status } = value;

    await skill.update({
      course_type_id: String(course_type_id),
      course_id: course_id,
      semester_id: semester_id,
      name: name,
      status: status || '1'
    });

    flashSuccessAndRedirect(req, res, 'Skill updated successfully.', '/admin/skills');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while updating the skill.', '/admin/skills');
  }
};

export const destroy = async (req, res) => {
  try {
    const { id } = req.params;
    const skill = await Skills.findByPk(id);

    if (!skill) {
      return flashErrorAndRedirect(req, res, 'Skill not found.', '/admin/skills');
    }

    await skill.destroy();
    flashSuccessAndRedirect(req, res, 'Skill deleted successfully.', '/admin/skills');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while deleting the skill.', '/admin/skills');
  }
};





