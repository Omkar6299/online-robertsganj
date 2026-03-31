import Qualification from '../../models/Qualification.js';
import Semester from '../../models/Semester.js';
import SemesterQualification from '../../models/SemesterQualification.js';
import { handleError, flashValidationErrorsAndRender, flashErrorAndRedirect, flashSuccessAndRedirect } from '../../utils/responseHelper.js';
import { col } from 'sequelize';
import Joi from 'joi';

const createClassSchema = Joi.object({
  name: Joi.string().required(),
  status: Joi.string().valid('1', '0').default('1')
});

const updateClassSchema = Joi.object({
  name: Joi.string().required(),
  status: Joi.string().valid('1', '0').required() // Remove default, make it required
});

export const index = async (req, res) => {
  try {
    // Ensure we're fetching from Qualification model (qualifications table), not CourseType
    const classes = await Qualification.findAll({
      order: [[col('Qualification.created_at'), 'DESC']],
      raw: true // Get plain objects to ensure data is accessible in view
    });

    res.render('admin_panel/classes/index', {
      title: 'Qualifications',
      classes: classes
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading qualifications.', '/admin/dashboard');
  }
};

export const create = async (req, res) => {
  try {
    res.render('admin_panel/classes/create', {
      title: 'Create Qualification'
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the form.', '/admin/qualifications');
  }
};

export const store = async (req, res) => {
  try {
    const { error, value } = createClassSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      return flashValidationErrorsAndRender(req, res, errors, 'admin_panel/classes/create', {
        title: 'Create Qualification'
      });
    }

    const { name, status } = value;

    // Create the new qualification
    const newQualification = await Qualification.create({
      name: name,
      status: status !== undefined ? status : '1' // Use explicit check to allow '0' value
    });

    // Automatically add this qualification as "hidden" for all existing semesters
    try {
      const allSemesters = await Semester.findAll({
        attributes: ['id']
      });

      if (allSemesters.length > 0) {
        const qualificationsToCreate = allSemesters.map(sem => ({
          semester_id: sem.id,
          qualification_id: newQualification.id,
          required_optional_hidden: 'hidden'
        }));

        await SemesterQualification.bulkCreate(qualificationsToCreate);
      }
    } catch (qualificationError) {
      // Log error but don't fail the qualification creation
      console.error('Error adding qualification to semesters:', qualificationError);
      // Continue - qualification is created successfully
    }

    flashSuccessAndRedirect(req, res, 'Qualification created successfully.', '/admin/qualifications');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while creating the qualification.', '/admin/qualifications');
  }
};

export const edit = async (req, res) => {
  try {
    const { id } = req.params;
    const classItem = await Qualification.findByPk(id);

    if (!classItem) {
      req.flash('error', 'Qualification not found.');
      return res.redirect('/admin/qualifications');
    }

    res.render('admin_panel/classes/edit', {
      title: 'Edit Qualification',
      classItem: classItem
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the qualification.', '/admin/qualifications');
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const classItem = await Qualification.findByPk(id);

    if (!classItem) {
      return flashErrorAndRedirect(req, res, 'Qualification not found.', '/admin/qualifications');
    }

    // Remove _method from body before validation (method-override field)
    const bodyForValidation = { ...req.body };
    delete bodyForValidation._method;

    const { error, value } = updateClassSchema.validate(bodyForValidation, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      // Pass errors and oldInput back to the edit view
      return flashValidationErrorsAndRender(req, res, errors, 'admin_panel/classes/edit', {
        title: 'Edit Qualification',
        classItem: classItem,
        oldInput: req.body
      });
    }

    const { name, status } = value;

    // Set values directly on the instance and save
    classItem.name = name;
    classItem.status = String(status); // Always convert to string, even if it's '0'

    // Use save() instead of update() to ensure the value is persisted
    await classItem.save();

    // Reload from database to ensure we have the latest data
    await classItem.reload();

    flashSuccessAndRedirect(req, res, 'Qualification updated successfully.', '/admin/qualifications');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while updating the qualification.', '/admin/qualifications');
  }
};

export const destroy = async (req, res) => {
  try {
    const { id } = req.params;
    const classItem = await Qualification.findByPk(id);

    if (!classItem) {
      return flashErrorAndRedirect(req, res, 'Qualification not found.', '/admin/qualifications');
    }

    await classItem.destroy();
    flashSuccessAndRedirect(req, res, 'Qualification deleted successfully.', '/admin/qualifications');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while deleting the qualification.', '/admin/qualifications');
  }
};



