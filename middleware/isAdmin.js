import { Admin } from '../models/index.js';

export const isAdmin = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      req.flash('error', 'Please login to access this page.');
      return res.redirect('/login');
    }

    const user = await Admin.findByPk(req.session.userId);

    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/login');
    }

    // Check if user has admin role
    const adminRoles = ['College', 'Admin', 'Super Admin'];
    if (!adminRoles.includes(user.role)) {
      req.flash('error', 'You are not authorized to access Admin Panel.');
      return res.redirect('/login');
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    req.flash('error', 'An error occurred. Please try again.');
    res.redirect('/login');
  }
};

