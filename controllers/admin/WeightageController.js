import Weightage from '../../models/Weightage.js';
import { handleError, flashValidationErrorsAndRender, flashErrorAndRedirect, flashSuccessAndRedirect } from '../../utils/responseHelper.js';
import { col } from 'sequelize';
import Joi from 'joi';

const createWeightageSchema = Joi.object({
  name: Joi.string().required(),
  percentage: Joi.number().precision(2).min(0).max(100).required(),
  status: Joi.string().valid('0', '1').required()
}).unknown(true);

const updateWeightageSchema = Joi.object({
  name: Joi.string().required(),
  percentage: Joi.number().precision(2).min(0).max(100).required(),
  status: Joi.string().valid('0', '1').required()
}).unknown(true);

export const index = async (req, res) => {
  try {
    const weightages = await Weightage.findAll({
      order: [[col('Weightage.created_at'), 'DESC']]
    });

    res.render('admin_panel/weightages/index', {
      title: 'Weightages',
      weightages: weightages
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading weightages.', '/admin/dashboard');
  }
};

export const create = async (req, res) => {
  try {
    res.render('admin_panel/weightages/create', {
      title: 'Create Weightage'
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the form.', '/admin/weightages');
  }
};

export const store = async (req, res) => {
  try {
    const { error, value } = createWeightageSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      return flashValidationErrorsAndRender(req, res, errors, 'admin_panel/weightages/create', {
        title: 'Create Weightage'
      });
    }

    const { name, percentage, status } = value;

    await Weightage.create({
      name: name,
      weightage_mark: percentage,
      status: status === '1'
    });

    flashSuccessAndRedirect(req, res, 'Weightage created successfully.', '/admin/weightages');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while creating the weightage.', '/admin/weightages');
  }
};

export const edit = async (req, res) => {
  try {
    const { id } = req.params;
    const weightage = await Weightage.findByPk(id);

    if (!weightage) {
      req.flash('error', 'Weightage not found.');
      return res.redirect('/admin/weightages');
    }

    res.render('admin_panel/weightages/edit', {
      title: 'Edit Weightage',
      weightage: weightage
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the weightage.', '/admin/weightages');
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const weightage = await Weightage.findByPk(id);

    if (!weightage) {
      return flashErrorAndRedirect(req, res, 'Weightage not found.', '/admin/weightages');
    }

    const { error, value } = updateWeightageSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      req.flash('errors', errors);
      return res.redirect(`/admin/weightages/${id}/edit`);
    }

    const { name, percentage, status } = value;

    await weightage.update({
      name: name,
      weightage_mark: percentage,
      status: status === '1'
    });

    flashSuccessAndRedirect(req, res, 'Weightage updated successfully.', '/admin/weightages');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while updating the weightage.', '/admin/weightages');
  }
};

export const destroy = async (req, res) => {
  try {
    const { id } = req.params;
    const weightage = await Weightage.findByPk(id);

    if (!weightage) {
      return flashErrorAndRedirect(req, res, 'Weightage not found.', '/admin/weightages');
    }

    await weightage.destroy();
    flashSuccessAndRedirect(req, res, 'Weightage deleted successfully.', '/admin/weightages');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while deleting the weightage.', '/admin/weightages');
  }
};





