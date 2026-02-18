const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

// Auth validations
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').trim().notEmpty().withMessage('First name required'),
  body('lastName').trim().notEmpty().withMessage('Last name required'),
  handleValidationErrors
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  handleValidationErrors
];

// Order validations
const createOrderValidation = [
  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  body('items.*.variantId').isInt().withMessage('Valid variant ID required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('customer.name').trim().notEmpty().withMessage('Customer name required'),
  body('customer.email').isEmail().withMessage('Valid email required'),
  body('customer.phone').trim().notEmpty().withMessage('Phone number required'),
  body('customer.address').trim().notEmpty().withMessage('Address required'),
  handleValidationErrors
];

// Product validations
const createPerfumeValidation = [
  body('name').trim().notEmpty().withMessage('Perfume name required'),
  body('description').trim().notEmpty().withMessage('Description required'),
  body('gender').isIn(['men', 'women', 'unisex']).withMessage('Valid gender required'),
  body('variants').isArray({ min: 1 }).withMessage('At least one variant required'),
  handleValidationErrors
];

// Cart validations
const addToCartValidation = [
  body('variantId').isInt().withMessage('Valid variant ID required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  handleValidationErrors
];

// Enquiry validations
const enquiryValidation = [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('message').trim().notEmpty().withMessage('Message required'),
  handleValidationErrors
];

module.exports = {
  registerValidation,
  loginValidation,
  createOrderValidation,
  createPerfumeValidation,
  addToCartValidation,
  enquiryValidation,
  handleValidationErrors
};
