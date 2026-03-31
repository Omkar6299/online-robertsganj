import { Admin, Role } from '../../models/index.js';
import { handleError, flashValidationErrorsAndRender, flashErrorAndRedirect, flashSuccessAndRedirect } from '../../utils/responseHelper.js';
import { hashPassword } from '../../utils/helpers.js';
import { col, Op } from 'sequelize';
import Joi from 'joi';

const createUserSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('College', 'Admin', 'Super Admin').default('Admin')
});

const updateUserSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
  password: Joi.string().min(6).allow('', null).optional(),
  role: Joi.string().valid('College', 'Admin', 'Super Admin').default('Admin'),
  _method: Joi.string().optional()
});

export const index = async (req, res) => {
  try {
    const users = await Admin.findAll({
      order: [['created_at', 'DESC']]
    });

    res.render('admin_panel/users/index', {
      title: 'Users',
      users: users,
      currentUser: req.session.user
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading users.', '/admin/dashboard');
  }
};

export const create = async (req, res) => {
  try {
    const roles = await Role.findAll();
    res.render('admin_panel/users/create', {
      title: 'Create User',
      roles: roles,
      currentUser: req.session.user
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the form.', '/admin/users');
  }
};

export const store = async (req, res) => {
  try {
    const { error, value } = createUserSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      return flashValidationErrorsAndRender(req, res, errors, 'admin_panel/users/create', {
        title: 'Create User',
        currentUser: req.session.user
      });
    }

    const { name, email, phone, password, role } = value;

    // Restriction: Only Super Admin can create another Super Admin
    if (role === 'Super Admin' && req.session.user.role !== 'Super Admin') {
      req.flash('error', 'Only Super Admin can create another Super Admin.');
      return res.render('admin_panel/users/create', {
        title: 'Create User',
        oldInput: req.body,
        currentUser: req.session.user
      });
    }

    // Check if email already exists
    const existingUser = await Admin.findOne({ where: { email } });
    if (existingUser) {
      req.flash('error', 'Email already exists.');
      return res.render('admin_panel/users/create', {
        title: 'Create User',
        oldInput: req.body,
        currentUser: req.session.user
      });
    }

    const hashedPassword = await hashPassword(password);

    await Admin.create({
      name: name,
      email: email,
      phone: phone,
      password: hashedPassword,
      role: role || 'Admin'
    });

    flashSuccessAndRedirect(req, res, 'User created successfully.', '/admin/users');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while creating the user.', '/admin/users');
  }
};

export const edit = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await Admin.findByPk(id);

    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/admin/users');
    }

    // Restriction: Only Super Admin can edit another Super Admin
    if (user.role === 'Super Admin' && req.session.user.role !== 'Super Admin') {
      req.flash('error', 'You do not have permission to edit a Super Admin user.');
      return res.redirect('/admin/users');
    }

    const roles = await Role.findAll();

    res.render('admin_panel/users/edit', {
      title: 'Edit User',
      targetUser: user,
      roles: roles,
      currentUser: req.session.user
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the user.', '/admin/users');
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await Admin.findByPk(id);

    if (!user) {
      return flashErrorAndRedirect(req, res, 'User not found.', '/admin/users');
    }

    const { error, value } = updateUserSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      req.flash('errors', errors);
      return res.redirect(`/admin/users/${id}/edit`);
    }

    const { name, email, phone, password, role } = value;

    // Restriction: Only Super Admin can update another Super Admin or change someone to Super Admin
    if ((user.role === 'Super Admin' || role === 'Super Admin') && req.session.user.role !== 'Super Admin') {
      req.flash('error', 'You do not have permission to update Super Admin records or roles.');
      return res.redirect('/admin/users');
    }

    // Check if email already exists for another user
    const existingUser = await Admin.findOne({ where: { email, id: { [Op.ne]: id } } });
    if (existingUser) {
      req.flash('error', 'Email already exists.');
      return res.redirect(`/admin/users/${id}/edit`);
    }

    const updateData = {
      name: name,
      email: email,
      phone: phone,
      role: role || 'Admin'
    };

    if (password) {
      updateData.password = await hashPassword(password);
    }

    await user.update(updateData);

    flashSuccessAndRedirect(req, res, 'User updated successfully.', '/admin/users');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while updating the user.', '/admin/users');
  }
};

export const destroy = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await Admin.findByPk(id);

    if (!user) {
      return flashErrorAndRedirect(req, res, 'User not found.', '/admin/users');
    }

    // Prevent deleting own account
    if (user.id === req.session.userId) {
      return flashErrorAndRedirect(req, res, 'You cannot delete your own account.', '/admin/users');
    }

    // Restriction: Only Super Admin can delete another Super Admin
    if (user.role === 'Super Admin' && req.session.user.role !== 'Super Admin') {
      return flashErrorAndRedirect(req, res, 'You do not have permission to delete a Super Admin user.', '/admin/users');
    }

    await user.destroy();
    flashSuccessAndRedirect(req, res, 'User deleted successfully.', '/admin/users');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while deleting the user.', '/admin/users');
  }
};
