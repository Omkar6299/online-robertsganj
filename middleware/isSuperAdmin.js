import { Admin } from '../models/index.js';

export const isSuperAdmin = async (req, res, next) => {
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

    // Strict check for Super Admin role
    if (user.role !== 'Super Admin') {
      req.flash('error', 'You are not authorized to access this section.');
      return res.redirect('/admin/dashboard');
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Super Admin middleware error:', error);
    req.flash('error', 'An error occurred. Please try again.');
    res.redirect('/login');
  }
};
