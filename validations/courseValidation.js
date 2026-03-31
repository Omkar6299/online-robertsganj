import Joi from 'joi';

export const createCourseSchema = Joi.object({
  course_type_id: Joi.alternatives().try(
    Joi.string(),
    Joi.number().integer()
  ).required().messages({
    'any.required': 'Course type is required.'
  }),
  course_name: Joi.string().max(255).required().messages({
    'any.required': 'Course name is required.',
    'string.max': 'Course name must not exceed 255 characters.'
  }),
  status: Joi.string().valid('0', '1').required().messages({
    'any.required': 'Status is required.',
    'any.only': 'Status must be either 0 or 1.'
  }),
  is_major1_required: Joi.string().valid('0', '1').optional(),
  is_major2_required: Joi.string().valid('0', '1').optional(),
  is_minor_required: Joi.string().valid('0', '1').optional()
});

export const updateCourseSchema = Joi.object({
  course_type_id: Joi.alternatives().try(
    Joi.string(),
    Joi.number().integer()
  ).required().messages({
    'any.required': 'Course type is required.'
  }),
  course_name: Joi.string().max(255).required().messages({
    'any.required': 'Course name is required.',
    'string.max': 'Course name must not exceed 255 characters.'
  }),
  status: Joi.string().valid('0', '1').required().messages({
    'any.required': 'Status is required.',
    'any.only': 'Status must be either 0 or 1.'
  }),
  is_major1_required: Joi.string().valid('0', '1').optional(),
  is_major2_required: Joi.string().valid('0', '1').optional(),
  is_minor_required: Joi.string().valid('0', '1').optional()
});

