export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errors = error.details.map(detail => detail.message);
        req.flash('errors', errors);
        return res.status(400).render(req.path.includes('admin') ? 'admin_panel/errors/validation' : 'errors/validation', {
          errors: errors,
          oldInput: req.body
        });
      }

      req.validated = value;
      next();
    } catch (err) {
      next(err);
    }
  };
};

