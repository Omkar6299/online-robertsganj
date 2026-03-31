import Joi from 'joi';

export const adminLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address.',
    'any.required': 'Email is required.'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long.',
    'any.required': 'Password is required.'
  }),
  remember: Joi.any().optional()
});

export const admissionLoginSchema = Joi.object({
  phone: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
    'string.pattern.base': 'Phone number must be exactly 10 digits.',
    'any.required': 'Phone number is required.'
  }),
  transaction_id: Joi.string().pattern(/^[0-9]{8,15}$/).required().messages({
    'any.required': 'Transaction ID is required.',
    'string.pattern.base': 'Transaction ID must be numeric (8-15 digits). Please enter the transaction ID you received after payment.'
  })
});

export const registrationFeesPaymentSchema = Joi.object({
  registration_no: Joi.string().optional().allow('').messages({
    'string.base': 'Registration number must be a valid string.'
  }),
  previous_registration_no: Joi.string().optional().allow('').messages({
    'string.base': 'Previous registration number must be a valid string.'
  }),
  course_type_id: Joi.alternatives().try(
    Joi.number().integer(),
    Joi.string().pattern(/^\d+$/)
  ).required().custom((value, helpers) => {
    if (value === '' || value === null || value === undefined) {
      return helpers.error('any.required');
    }
    return typeof value === 'string' ? parseInt(value) : value;
  }).messages({
    'any.required': 'Please select a course type.',
    'alternatives.match': 'Course type must be a valid number.'
  }),
  course_id: Joi.alternatives().try(
    Joi.number().integer(),
    Joi.string().pattern(/^\d+$/)
  ).required().custom((value, helpers) => {
    if (value === '' || value === null || value === undefined) {
      return helpers.error('any.required');
    }
    return typeof value === 'string' ? parseInt(value) : value;
  }).messages({
    'any.required': 'Please select a course.',
    'alternatives.match': 'Course must be a valid number.'
  }),
  semester_id: Joi.alternatives().try(
    Joi.number().integer(),
    Joi.string().pattern(/^\d+$/)
  ).required().custom((value, helpers) => {
    if (value === '' || value === null || value === undefined) {
      return helpers.error('any.required');
    }
    return typeof value === 'string' ? parseInt(value) : value;
  }).messages({
    'any.required': 'Please select a semester.',
    'alternatives.match': 'Semester must be a valid number.'
  }),
  name: Joi.string().max(255).required().messages({
    'any.required': 'Student name is required.',
    'string.max': 'Name must not exceed 255 characters.'
  }),
  father_name: Joi.string().max(255).required().messages({
    'any.required': 'Father\'s name is required.',
    'string.max': 'Father\'s name must not exceed 255 characters.'
  }),
  mother_name: Joi.string().max(255).required().messages({
    'any.required': 'Mother\'s name is required.',
    'string.max': 'Mother\'s name must not exceed 255 characters.'
  }),
  dob: Joi.date().required().messages({
    'any.required': 'Date of birth is required.',
    'date.base': 'Date of birth must be a valid date.'
  }),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
    'any.required': 'Phone number is required.',
    'string.pattern.base': 'Phone number must be exactly 10 digits.'
  }),
  email: Joi.string().email().max(255).required().messages({
    'any.required': 'Email address is required.',
    'string.email': 'Please enter a valid email address.',
    'string.max': 'Email must not exceed 255 characters.'
  }),
  academic_year_id: Joi.number().integer().required().messages({
    'any.required': 'Please select an academic year.',
    'number.base': 'Academic year must be a valid number.'
  })
});

