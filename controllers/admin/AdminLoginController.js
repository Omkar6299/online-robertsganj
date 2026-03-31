import { Admin } from '../../models/index.js';
import { hashPassword, comparePassword } from '../../utils/helpers.js';
import { validate } from '../../middleware/validation.js';
import { adminLoginSchema } from '../../validations/authValidation.js';
import { handleError, flashValidationErrorsAndRender, flashErrorAndRedirect, flashSuccessAndRedirect } from '../../utils/responseHelper.js';

export const adminLogin = (req, res) => {
  res.render('admin_panel/auth/login', {
    title: 'Admin Login',
    querySuccess: req.query.success ? decodeURIComponent(req.query.success) : null,
    queryError: req.query.error ? decodeURIComponent(req.query.error) : null
  });
};

export const adminLoginPost = async (req, res) => {
  try {
    const { error, value } = adminLoginSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      return flashValidationErrorsAndRender(req, res, errors, 'admin_panel/auth/login', {
        title: 'Admin Login'
      });
    }

    const { email, password } = value;
    const user = await Admin.findOne({ where: { email } });

    if (!user) {
      req.flash('error', 'Invalid email or password.');
      return res.render('admin_panel/auth/login', {
        title: 'Admin Login',
        oldInput: req.body
      });
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      req.flash('error', 'Invalid email or password.');
      return res.render('admin_panel/auth/login', {
        title: 'Admin Login',
        oldInput: req.body
      });
    }

    // Check if user has admin role
    const adminRoles = ['College', 'Admin', 'Super Admin'];
    if (!adminRoles.includes(user.role)) {
      req.flash('error', 'You are not authorized to access Admin Panel.');
      return res.render('admin_panel/auth/login', {
        title: 'Admin Login',
        oldInput: req.body
      });
    }

    // Set session data before regeneration
    const successMessage = 'Welcome Admin!';

    req.session.regenerate(async (err) => {
      if (err) {
        console.error('Session regeneration error:', err);
        req.flash('error', 'An error occurred during login. Please try again.');
        return res.render('admin_panel/auth/login', { title: 'Admin Login' });
      }

      // Set session data after regeneration
      req.session.userId = user.id;
      req.session.user = user;

      // Save session before redirecting
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Session save error:', saveErr);
          req.flash('error', 'An error occurred during login. Please try again.');
          return res.render('admin_panel/auth/login', { title: 'Admin Login' });
        }

        // Set flash message after session is saved
        req.flash('success', successMessage);
        res.redirect('/admin/dashboard');
      });
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred. Please try again.', null, 'admin_panel/auth/login', {
      title: 'Admin Login'
    });
  }
};

export const adminLogout = (req, res) => {
  // Store success message before destroying session
  const successMessage = 'You have been logged out successfully.';

  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
      // If session destroy fails, try to redirect with error
      if (req.session) {
        req.flash('error', 'An error occurred during logout. Please try again.');
        return res.redirect('/admin/dashboard');
      }
      // If session is already destroyed, just redirect
      return res.redirect('/login?error=logout_failed');
    }

    // After session is destroyed, redirect with success message as query parameter
    // Flash messages won't work after session destroy, so we use query parameter
    res.redirect(`/login?success=${encodeURIComponent(successMessage)}`);
  });
};

