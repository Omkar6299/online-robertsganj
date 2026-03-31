import Subject from '../../models/Subject.js';
import Course from '../../models/Course.js';
import { handleError, flashValidationErrorsAndRender, flashErrorAndRedirect, flashSuccessAndRedirect } from '../../utils/responseHelper.js';
import { col, Op } from 'sequelize';
import Joi from 'joi';

const createSubjectSchema = Joi.object({
  course_id: Joi.string().required(),
  subject_name: Joi.string().required(),
  is_practical: Joi.number().valid(0, 1).default(0),
  status: Joi.string().valid('1', '0').default('1')
});

const updateSubjectSchema = Joi.object({
  course_id: Joi.string().required(),
  subject_name: Joi.string().required(),
  is_practical: Joi.number().valid(0, 1).default(0),
  status: Joi.string().valid('1', '0').required()
});

export const index = async (req, res) => {
  try {
    const subjects = await Subject.findAll({
      include: [{
        model: Course,
        as: 'course',
        attributes: ['id', 'name']
      }],
      order: [[col('Subject.created_at'), 'DESC']],
      raw: false // Keep as false to access nested course data
    });

    res.render('admin_panel/subjects/index', {
      title: 'Subjects',
      subjects: subjects
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading subjects.', '/admin/dashboard');
  }
};

export const create = async (req, res) => {
  try {
    const courses = await Course.findAll({
      where: { status: '1' },
      order: [['name', 'ASC']]
    });

    res.render('admin_panel/subjects/create', {
      title: 'Create Subject',
      courses: courses
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the form.', '/admin/subjects');
  }
};

export const store = async (req, res) => {
  try {
    // Handle checkbox for store
    const bodyForValidation = { 
        ...req.body,
        is_practical: req.body.is_practical ? 1 : 0 
    };

    const { error, value } = createSubjectSchema.validate(bodyForValidation, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      const courses = await Course.findAll({
        where: { status: '1' },
        order: [['name', 'ASC']]
      });

      return flashValidationErrorsAndRender(req, res, errors, 'admin_panel/subjects/create', {
        title: 'Create Subject',
        courses: courses
      });
    }

    const { course_id, subject_name, status, is_practical } = value;

    // Check for duplicate (course_id + subject_name)
    const existingSubject = await Subject.findOne({
      where: {
        course_id: String(course_id),
        subject_name: subject_name
      }
    });

    if (existingSubject) {
      const courses = await Course.findAll({
        where: { status: '1' },
        order: [['name', 'ASC']]
      });
      return flashValidationErrorsAndRender(req, res, ['This subject already exists for the selected course.'], 'admin_panel/subjects/create', {
        title: 'Create Subject',
        courses: courses
      });
    }

    await Subject.create({
      course_id: String(course_id),
      subject_name: subject_name,
      is_practical: is_practical || 0,
      status: status !== undefined ? String(status) : '1'
    });

    flashSuccessAndRedirect(req, res, 'Subject created successfully.', '/admin/subjects');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while creating the subject.', '/admin/subjects');
  }
};

export const edit = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByPk(id);

    if (!subject) {
      req.flash('error', 'Subject not found.');
      return res.redirect('/admin/subjects');
    }

    const courses = await Course.findAll({
      where: { status: '1' },
      order: [['name', 'ASC']]
    });

    res.render('admin_panel/subjects/edit', {
      title: 'Edit Subject',
      subject: subject,
      courses: courses
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the subject.', '/admin/subjects');
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByPk(id);

    if (!subject) {
      return flashErrorAndRedirect(req, res, 'Subject not found.', '/admin/subjects');
    }

    // Remove _method from body before validation (method-override field)
    const bodyForValidation = { 
      ...req.body,
      is_practical: req.body.is_practical ? 1 : 0 // Handle checkbox 
    };
    delete bodyForValidation._method;

    const { error, value } = updateSubjectSchema.validate(bodyForValidation, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      const courses = await Course.findAll({
        where: { status: '1' },
        order: [['name', 'ASC']]
      });
      return flashValidationErrorsAndRender(req, res, errors, 'admin_panel/subjects/edit', {
        title: 'Edit Subject',
        subject: subject,
        courses: courses,
        oldInput: req.body
      });
    }

    const { course_id, subject_name, status, is_practical } = value;

    // Check for duplicate (course_id + subject_name) excluding current subject
    const existingSubject = await Subject.findOne({
      where: {
        course_id: String(course_id),
        subject_name: subject_name,
        id: { [Op.ne]: id }
      }
    });

    if (existingSubject) {
      const courses = await Course.findAll({
        where: { status: '1' },
        order: [['name', 'ASC']]
      });
      return flashValidationErrorsAndRender(req, res, ['This subject already exists for the selected course.'], 'admin_panel/subjects/edit', {
        title: 'Edit Subject',
        subject: subject,
        courses: courses,
        oldInput: req.body
      });
    }

    // Set values directly on the instance and save
    subject.course_id = String(course_id);
    subject.subject_name = subject_name;
    subject.is_practical = is_practical;
    subject.status = String(status); // Always convert to string, even if it's '0'

    await subject.save();
    await subject.reload();

    flashSuccessAndRedirect(req, res, 'Subject updated successfully.', '/admin/subjects');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while updating the subject.', '/admin/subjects');
  }
};

export const destroy = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByPk(id);

    if (!subject) {
      return flashErrorAndRedirect(req, res, 'Subject not found.', '/admin/subjects');
    }

    await subject.destroy();
    flashSuccessAndRedirect(req, res, 'Subject deleted successfully.', '/admin/subjects');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while deleting the subject.', '/admin/subjects');
  }
};



