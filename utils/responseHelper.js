/**
 * Response helper functions for consistent error and success handling
 */

/**
 * Send success flash message and redirect
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {string} redirectUrl - URL to redirect to
 */
export const flashSuccessAndRedirect = (req, res, message, redirectUrl, oldInput = null) => {
  req.flash('success', message);
  if (oldInput) {
    req.flash('oldInput', oldInput);
  }
  req.session.save(() => {
    res.redirect(redirectUrl);
  });
};

/**
 * Send error flash message and redirect
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {string} redirectUrl - URL to redirect to
 */
export const flashErrorAndRedirect = (req, res, message, redirectUrl, oldInput = null) => {
  req.flash('error', message);
  if (oldInput) {
    req.flash('oldInput', oldInput);
  }
  req.session.save(() => {
    res.redirect(redirectUrl);
  });
};

/**
 * Send validation errors flash message and render view
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Array} errors - Array of error messages
 * @param {string} view - View to render
 * @param {Object} viewData - Additional data to pass to view
 */
export const flashValidationErrorsAndRender = (req, res, errors, view, viewData = {}) => {
  req.flash('errors', errors);
  res.render(view, {
    ...viewData,
    errors: errors,
    oldInput: req.body
  });
};

/**
 * Handle controller errors consistently
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {string} errorMessage - User-friendly error message
 * @param {string} redirectUrl - URL to redirect to (optional)
 * @param {string} view - View to render (optional, if not redirecting)
 * @param {Object} viewData - Additional data for view (optional)
 */
export const handleError = (req, res, error, errorMessage, redirectUrl = null, view = null, viewData = {}) => {
  console.error('Error:', errorMessage, error);

  if (redirectUrl) {
    req.flash('error', errorMessage);
    req.session.save(() => {
      res.redirect(redirectUrl);
    });
  } else if (view) {
    req.flash('error', errorMessage);
    res.render(view, {
      ...viewData,
      title: viewData.title || 'Error'
    });
  } else {
    // Default: send 500 error
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Send JSON success response
 * @param {Object} res - Express response object
 * @param {Object} data - Data to send
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const sendSuccessResponse = (res, data = {}, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message: message,
    data: data
  });
};

/**
 * Send JSON error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {Object} errors - Additional error details (optional)
 */
export const sendErrorResponse = (res, message = 'An error occurred', statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message: message
  };

  if (errors) {
    response.errors = errors;
  }

  res.status(statusCode).json(response);
};

