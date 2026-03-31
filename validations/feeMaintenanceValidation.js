import Joi from 'joi';

const feeMaintenanceSchema = Joi.object({
  Course: Joi.number().positive().required().messages({
    'number.base': 'Course must be a number',
    'any.required': 'Course is required'
  }),
  semester: Joi.number().positive().required().messages({
    'number.base': 'Semester must be a number',
    'any.required': 'Semester is required'
  }),
  Total_Fee_Amount: Joi.number().min(0).required(),
  Fee_Name: Joi.string().max(100).allow('', null),
  General_fee_Amount: Joi.number().min(0).default(0),
  Girls_fee_Amount: Joi.number().min(0).default(0),
  Minority_Fee_Amount: Joi.string().max(100).allow('', null),
  OBC_fee_Amount: Joi.number().min(0).default(0),
  SC_fee_Amount: Joi.number().min(0).default(0),
  ST_fee_Amount: Joi.number().min(0).default(0),
  Practical_Fee: Joi.number().min(0).default(0),
  late_fee: Joi.number().min(0).default(0),
  is_late_fee_applicable: Joi.number().valid(0, 1).default(0),
  fee_Type: Joi.string().max(5).allow('', null),
  fee_Active: Joi.string().max(10).allow('', null),
  Student_Type: Joi.string().max(45).allow('', null),
  Ex_Student: Joi.string().max(5).allow('', null),
  Lab_Fee_Type: Joi.string().max(45).allow('', null)
}).unknown(true);

export const createFeeMaintenanceSchema = feeMaintenanceSchema;
export const updateFeeMaintenanceSchema = feeMaintenanceSchema;
