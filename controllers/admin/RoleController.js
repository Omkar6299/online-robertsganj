import { Role } from '../../models/index.js';
import { handleError, flashValidationErrorsAndRender, flashErrorAndRedirect, flashSuccessAndRedirect } from '../../utils/responseHelper.js';
import Joi from 'joi';

const roleSchema = Joi.object({
  name: Joi.string().required(),
  guard_name: Joi.string().default('web'),
  _method: Joi.string().optional()
});

export const index = async (req, res) => {
  try {
    const roles = await Role.findAll();
    res.render('admin_panel/roles/index', {
      title: 'Roles',
      roles: roles,
      currentUser: req.session.user
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading roles.', '/admin/dashboard');
  }
};

export const create = async (req, res) => {
  try {
    res.render('admin_panel/roles/create', {
      title: 'Create Role',
      currentUser: req.session.user
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the form.', '/admin/roles');
  }
};

export const store = async (req, res) => {
  try {
    const { error, value } = roleSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return flashValidationErrorsAndRender(req, res, errors, 'admin_panel/roles/create', { 
        title: 'Create Role',
        oldInput: req.body
      });
    }

    await Role.create(value);
    flashSuccessAndRedirect(req, res, 'Role created successfully.', '/admin/roles');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while creating role.', '/admin/roles/create');
  }
};

export const edit = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return flashErrorAndRedirect(req, res, 'Role not found.', '/admin/roles');
    }
    res.render('admin_panel/roles/edit', {
      title: 'Edit Role',
      role: role,
      currentUser: req.session.user
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the form.', '/admin/roles');
  }
};

export const update = async (req, res) => {
  try {
    const { error, value } = roleSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return flashValidationErrorsAndRender(req, res, errors, 'admin_panel/roles/edit', { 
        title: 'Edit Role', 
        role: { ...req.body, id: req.params.id }
      });
    }

    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return flashErrorAndRedirect(req, res, 'Role not found.', '/admin/roles');
    }

    // Filter out _method before updating
    const updateData = { ...value };
    delete updateData._method;

    await role.update(updateData);
    flashSuccessAndRedirect(req, res, 'Role updated successfully.', '/admin/roles');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while updating role.', '/admin/roles');
  }
};

export const destroy = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return flashErrorAndRedirect(req, res, 'Role not found.', '/admin/roles');
    }

    await role.destroy();
    flashSuccessAndRedirect(req, res, 'Role deleted successfully.', '/admin/roles');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while deleting role.', '/admin/roles');
  }
};
