export const checkAdmissionLogin = (req, res, next) => {
  if (!req.session.admission_user_id) {
    req.session.admission_user_id = null;
    req.session.admission_name = null;
    req.flash('error', 'Your session has expired. Please login again.');
    return res.redirect('/admission_login');
  }
  next();
};

