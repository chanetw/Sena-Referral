import Joi from 'joi';

// Validation middleware generator
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลไม่ถูกต้อง',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    next();
  };
};

// Auth validation schemas
const authSchemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'รูปแบบอีเมลไม่ถูกต้อง',
      'any.required': 'กรุณาป้อนอีเมล'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
      'any.required': 'กรุณาป้อนรหัสผ่าน'
    }),
    role: Joi.string().valid('admin', 'agent', 'manager').optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'รูปแบบอีเมลไม่ถูกต้อง',
      'any.required': 'กรุณาป้อนอีเมล'
    }),
    password: Joi.string().required().messages({
      'any.required': 'กรุณาป้อนรหัสผ่าน'
    })
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'กรุณาป้อนรหัสผ่านปัจจุบัน'
    }),
    newPassword: Joi.string().min(6).required().messages({
      'string.min': 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร',
      'any.required': 'กรุณาป้อนรหัสผ่านใหม่'
    })
  })
};

// Agent validation schemas
const agentSchemas = {
  create: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'รูปแบบอีเมลไม่ถูกต้อง',
      'any.required': 'กรุณาป้อนอีเมล'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
      'any.required': 'กรุณาป้อนรหัสผ่าน'
    }),
    agentCode: Joi.string().required().messages({
      'any.required': 'กรุณาป้อนรหัสเอเจนต์'
    }),
    idCard: Joi.string().length(13).pattern(/^[0-9]+$/).required().messages({
      'string.length': 'เลขประจำตัวประชาชนต้องมี 13 หลัก',
      'string.pattern.base': 'เลขประจำตัวประชาชนต้องเป็นตัวเลขเท่านั้น',
      'any.required': 'กรุณาป้อนเลขประจำตัวประชาชน'
    }),
    firstName: Joi.string().required().messages({
      'any.required': 'กรุณาป้อนชื่อ'
    }),
    lastName: Joi.string().required().messages({
      'any.required': 'กรุณาป้อนนามสกุล'
    }),
    phone: Joi.string().pattern(/^[0-9-+]+$/).optional().messages({
      'string.pattern.base': 'เบอร์โทรศัพท์ไม่ถูกต้อง'
    }),
    address: Joi.string().optional(),
    registrationDate: Joi.date().required().messages({
      'any.required': 'กรุณาเลือกวันที่ลงทะเบียน'
    }),
    bankAccount: Joi.string().optional(),
    bankName: Joi.string().optional(),
    taxId: Joi.string().length(13).pattern(/^[0-9]+$/).optional().messages({
      'string.length': 'เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก',
      'string.pattern.base': 'เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลขเท่านั้น'
    })
  }),

  update: Joi.object({
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    phone: Joi.string().pattern(/^[0-9-+]+$/).optional().messages({
      'string.pattern.base': 'เบอร์โทรศัพท์ไม่ถูกต้อง'
    }),
    address: Joi.string().optional(),
    status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
    bankAccount: Joi.string().optional(),
    bankName: Joi.string().optional(),
    taxId: Joi.string().length(13).pattern(/^[0-9]+$/).optional().messages({
      'string.length': 'เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก',
      'string.pattern.base': 'เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลขเท่านั้น'
    })
  })
};

// Customer validation schemas
const customerSchemas = {
  create: Joi.object({
    agentId: Joi.number().integer().positive().required().messages({
      'any.required': 'กรุณาระบุเอเจนต์'
    }),
    firstName: Joi.string().required().messages({
      'any.required': 'กรุณาป้อนชื่อ'
    }),
    lastName: Joi.string().required().messages({
      'any.required': 'กรุณาป้อนนามสกุล'
    }),
    phone: Joi.string().pattern(/^[0-9-+]+$/).optional().messages({
      'string.pattern.base': 'เบอร์โทรศัพท์ไม่ถูกต้อง'
    }),
    idCard: Joi.string().length(13).pattern(/^[0-9]+$/).optional().messages({
      'string.length': 'เลขประจำตัวประชาชนต้องมี 13 หลัก',
      'string.pattern.base': 'เลขประจำตัวประชาชนต้องเป็นตัวเลขเท่านั้น'
    }),
    email: Joi.string().email().optional().messages({
      'string.email': 'รูปแบบอีเมลไม่ถูกต้อง'
    }),
    projectId: Joi.number().integer().positive().optional(),
    budgetMin: Joi.number().positive().optional(),
    budgetMax: Joi.number().positive().optional(),
    source: Joi.string().valid('referral', 'walk_in', 'online', 'phone', 'other').optional(),
    notes: Joi.string().optional()
  }),

  update: Joi.object({
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    phone: Joi.string().pattern(/^[0-9-+]+$/).optional().messages({
      'string.pattern.base': 'เบอร์โทรศัพท์ไม่ถูกต้อง'
    }),
    idCard: Joi.string().length(13).pattern(/^[0-9]+$/).optional().messages({
      'string.length': 'เลขประจำตัวประชาชนต้องมี 13 หลัก',
      'string.pattern.base': 'เลขประจำตัวประชาชนต้องเป็นตัวเลขเท่านั้น'
    }),
    email: Joi.string().email().optional().messages({
      'string.email': 'รูปแบบอีเมลไม่ถูกต้อง'
    }),
    projectId: Joi.number().integer().positive().optional(),
    budgetMin: Joi.number().positive().optional(),
    budgetMax: Joi.number().positive().optional(),
    status: Joi.string().valid(
      'new', 'contacted', 'interested', 'visit_scheduled', 
      'visited', 'negotiating', 'closed_won', 'closed_lost'
    ).optional(),
    source: Joi.string().valid('referral', 'walk_in', 'online', 'phone', 'other').optional(),
    notes: Joi.string().optional(),
    senaApproved: Joi.boolean().optional()
  })
};

// Project validation schemas
const projectSchemas = {
  create: Joi.object({
    projectCode: Joi.string().required().messages({
      'any.required': 'กรุณาป้อนรหัสโครงการ'
    }),
    projectName: Joi.string().required().messages({
      'any.required': 'กรุณาป้อนชื่อโครงการ'
    }),
    projectType: Joi.string().valid('condo', 'house', 'townhome', 'commercial').required().messages({
      'any.required': 'กรุณาเลือกประเภทโครงการ'
    }),
    location: Joi.string().optional(),
    priceRangeMin: Joi.number().positive().optional(),
    priceRangeMax: Joi.number().positive().optional(),
    salesTeam: Joi.string().optional(),
    description: Joi.string().optional(),
    features: Joi.array().optional(),
    launchDate: Joi.date().optional(),
    completionDate: Joi.date().optional()
  }),

  update: Joi.object({
    projectName: Joi.string().optional(),
    projectType: Joi.string().valid('condo', 'house', 'townhome', 'commercial').optional(),
    location: Joi.string().optional(),
    priceRangeMin: Joi.number().positive().optional(),
    priceRangeMax: Joi.number().positive().optional(),
    salesTeam: Joi.string().optional(),
    description: Joi.string().optional(),
    features: Joi.array().optional(),
    isActive: Joi.boolean().optional(),
    launchDate: Joi.date().optional(),
    completionDate: Joi.date().optional()
  })
};

// Export validation middlewares
export const validateAuth = {
  register: validate(authSchemas.register),
  login: validate(authSchemas.login),
  changePassword: validate(authSchemas.changePassword)
};

export const validateAgent = {
  create: validate(agentSchemas.create),
  update: validate(agentSchemas.update)
};

export const validateCustomer = {
  create: validate(customerSchemas.create),
  update: validate(customerSchemas.update)
};

export const validateProject = {
  create: validate(projectSchemas.create),
  update: validate(projectSchemas.update)
};

// Query parameter validation
export const validateQuery = {
  pagination: (req, res, next) => {
    const schema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      sort: Joi.string().optional(),
      order: Joi.string().valid('ASC', 'DESC').default('DESC')
    });

    const { error, value } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'พารามิเตอร์การค้นหาไม่ถูกต้อง',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.query = { ...req.query, ...value };
    next();
  }
};