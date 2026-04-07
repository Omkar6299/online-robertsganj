import Joi from 'joi';

export const createAcademicYearSchema = Joi.object({
  session: Joi.string().required().messages({
    'string.empty': 'Session name is required.',
    'any.required': 'Session name is required.'
  }),
  status: Joi.string().valid('Active', 'Inactive').default('Inactive')
});

export const updateAcademicYearSchema = Joi.object({
  session: Joi.string().required().messages({
    'string.empty': 'Session name is required.',
    'any.required': 'Session name is required.'
  }),
  status: Joi.string().valid('Active', 'Inactive').default('Inactive')
});
