/**
 * Custom flash middleware to replace express-flash
 * Avoids deprecated util.isArray API
 */
export default function flashMiddleware(req, res, next) {
  // Initialize flash object if it doesn't exist
  if (!req.session.flash) {
    req.session.flash = {};
  }

  // Create flash function
  req.flash = function(type, message) {
    // Ensure session.flash exists
    if (!req.session.flash) {
      req.session.flash = {};
    }

    // Ensure the type array exists
    if (!req.session.flash[type]) {
      req.session.flash[type] = [];
    }

    if (arguments.length === 1) {
      // Reading: return messages and clear them
      const messages = req.session.flash[type].slice(); // Copy array
      delete req.session.flash[type];
      return messages;
    } else {
      // Writing: add message(s)
      if (Array.isArray(message)) {
        req.session.flash[type].push(...message);
      } else {
        req.session.flash[type].push(message);
      }
      return req.session.flash[type];
    }
  };

  next();
}

