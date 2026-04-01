import Joi from 'joi';

export const documentTypeSchema = Joi.object({
  name: Joi.string().max(255).required().messages({
    'any.required': 'Document name is required.',
    'string.max': 'Document name must not exceed 255 characters.'
  }),
  code: Joi.string().max(255).required().messages({
    'any.required': 'Document code is required.',
    'string.max': 'Document code must not exceed 255 characters.'
  }),
  status: Joi.alternatives().try(Joi.string(), Joi.boolean(), Joi.number()).optional()
});
