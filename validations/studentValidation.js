import Joi from 'joi';

export const personalDetailSchema = Joi.object({
  name: Joi.string().max(255).required().messages({
    'any.required': 'Name is required.',
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
  gender: Joi.string().valid('Male', 'Female', 'Other').allow(null, '').optional(),
  dob: Joi.date().required().messages({
    'any.required': 'Date of birth is required.',
    'date.base': 'Date of birth must be a valid date.'
  }),
  category: Joi.string().allow(null, '').optional(),
  sub_category: Joi.string().allow(null, '').optional(),
  caste_certificate_number: Joi.string().allow(null, '').optional(),
  whatsapp_number: Joi.string().pattern(/^[0-9]{10}$/).allow(null, '').optional().messages({
    'string.pattern.base': 'WhatsApp number must be exactly 10 digits.'
  }),
  aadhar_card_no: Joi.string().allow(null, '').optional(),
  samarth_registration_no: Joi.string().allow(null, '').optional()
});

export const addressDetailSchema = Joi.object({
  father_occupation: Joi.string().allow(null, '').optional(),
  father_annual_income: Joi.string().allow(null, '').optional(),
  local_guardian: Joi.string().allow(null, '').optional(),
  local_guardian_mobile_no: Joi.string().pattern(/^[0-9]{10}$/).allow(null, '').optional().messages({
    'string.pattern.base': 'Local guardian mobile number must be exactly 10 digits.'
  }),
  blood_group: Joi.string().allow(null, '').optional(),
  mailing_address: Joi.string().allow(null, '').optional(),
  mailing_state: Joi.string().allow(null, '').optional(),
  mailing_district: Joi.string().allow(null, '').optional(),
  mailing_tehsil: Joi.string().allow(null, '').optional(),
  mailing_pincode: Joi.string().pattern(/^[0-9]{6}$/).allow(null, '').optional().messages({
    'string.pattern.base': 'Mailing pincode must be exactly 6 digits.'
  }),
  permanent_address: Joi.string().allow(null, '').optional(),
  permanent_state: Joi.string().allow(null, '').optional(),
  permanent_district: Joi.string().allow(null, '').optional(),
  permanent_tehsil: Joi.string().allow(null, '').optional(),
  permanent_pincode: Joi.string().pattern(/^[0-9]{6}$/).allow(null, '').optional().messages({
    'string.pattern.base': 'Permanent pincode must be exactly 6 digits.'
  }),
  guardian_address: Joi.string().allow(null, '').optional()
});

export const educationalDetailSchema = Joi.object({
  educations: Joi.array().items(
    Joi.object({
      class_name: Joi.string().required().messages({
        'any.required': 'Class name is required.'
      }),
      board_name: Joi.string().required().messages({
        'any.required': 'Board name is required.'
      }),
      school_name: Joi.string().required().messages({
        'any.required': 'School name is required.'
      }),
      year_of_passing: Joi.string().required().messages({
        'any.required': 'Year of passing is required.'
      }),
      division: Joi.string().required().messages({
        'any.required': 'Division is required.'
      }),
      roll_no: Joi.string().required().messages({
        'any.required': 'Roll number is required.'
      }),
      obtained_marks: Joi.string().allow(null, '').optional(),
      total_marks: Joi.string().allow(null, '').optional(),
      mark_type: Joi.string().valid('Percentage', 'CGPA').required().messages({
        'any.required': 'Mark type is required.',
        'any.only': 'Mark type must be either Percentage or CGPA.'
      }),
      cgpa: Joi.string().allow(null, '').optional(),
      max_cgpa: Joi.string().default('10').optional(),
      subject_details: Joi.string().required().messages({
        'any.required': 'Subject details are required.'
      })
    })
  ).min(1).required().messages({
    'any.required': 'At least one educational detail is required.',
    'array.min': 'At least one educational detail is required.'
  })
});

export const subjectDetailSchema = Joi.object({
  major_subject1: Joi.string().required().messages({
    'any.required': 'Major subject 1 is required.'
  }),
  major_subject2: Joi.string().required().messages({
    'any.required': 'Major subject 2 is required.'
  }),
  minor_elective: Joi.string().required().messages({
    'any.required': 'Minor elective is required.'
  }),
  skill_development: Joi.string().allow(null, '').optional(),
  co_curriculum: Joi.string().allow(null, '').optional()
});

export const weightageDetailSchema = Joi.object({
  weightages: Joi.array().items(
    Joi.object({
      weightage_id: Joi.number().integer().required().messages({
        'any.required': 'Weightage is required.',
        'number.base': 'Weightage must be a valid number.'
      }),
      percentage: Joi.number().min(0).max(100).required().messages({
        'any.required': 'Percentage is required.',
        'number.min': 'Percentage must be at least 0.',
        'number.max': 'Percentage must not exceed 100.'
      })
    })
  ).optional()
});

