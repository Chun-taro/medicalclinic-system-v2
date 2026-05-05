const { body, param, query, validationResult } = require('express-validator');

/**
 * Sends a 422 response if any express-validator errors exist.
 * Use as middleware after validation rules.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

// ─── Auth validators ───────────────────────────────────────────────────────────

const validateSignup = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  body('idNumber').trim().notEmpty().withMessage('ID number is required'),
  body('contactNumber').trim().notEmpty().withMessage('Contact number is required'),
  validate
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

// ─── Appointment validators ────────────────────────────────────────────────────

const validateBookAppointment = [
  body('appointmentDate')
    .notEmpty().withMessage('Appointment date is required')
    .isISO8601().withMessage('Appointment date must be a valid date'),
  body('purpose')
    .trim()
    .notEmpty().withMessage('Purpose/reason for visit is required')
    .isLength({ max: 500 }).withMessage('Purpose must be 500 characters or less'),
  body('additionalNotes')
    .optional()
    .isLength({ max: 1000 }).withMessage('Additional notes must be 1000 characters or less'),
  validate
];

// ─── Consultation validators ───────────────────────────────────────────────────

const validateSaveConsultation = [
  param('id').isMongoId().withMessage('Invalid appointment ID'),
  body('diagnosis')
    .optional({ values: 'falsy' })
    .isLength({ max: 2000 }).withMessage('Diagnosis must be 2000 characters or less'),
  body('management')
    .optional({ values: 'falsy' })
    .isLength({ max: 2000 }).withMessage('Management must be 2000 characters or less'),
  body('bloodPressure')
    .optional({ values: 'falsy' })
    .isLength({ max: 50 }).withMessage('Blood pressure must be 50 characters or less'),
  body('temperature')
    .optional({ values: 'falsy' })
    .isLength({ max: 50 }).withMessage('Temperature must be 50 characters or less'),
  body('heartRate')
    .optional({ values: 'falsy' })
    .isLength({ max: 50 }).withMessage('Heart rate must be 50 characters or less'),
  body('oxygenSaturation')
    .optional({ values: 'falsy' })
    .isLength({ max: 50 }).withMessage('Oxygen saturation must be 50 characters or less'),
  body('medicinesPrescribed')
    .optional({ values: 'falsy' })
    .isArray().withMessage('Medicines prescribed must be an array'),
  validate
];

// ─── Medicine validators ───────────────────────────────────────────────────────

const validateCreateMedicine = [
  body('name').trim().notEmpty().withMessage('Medicine name is required'),
  body('quantityInStock')
    .isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('unit').trim().notEmpty().withMessage('Unit is required'),
  body('expiryDate')
    .isISO8601().withMessage('Expiry date must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    }),
  validate
];

const validateDispenseMedicine = [
  param('id').isMongoId().withMessage('Invalid medicine ID'),
  body('quantity')
    .isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  validate
];

// ─── User role validator ───────────────────────────────────────────────────────

const validateUpdateRole = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('role')
    .isIn(['patient', 'admin', 'doctor', 'superadmin'])
    .withMessage('Role must be one of: patient, admin, doctor, superadmin'),
  validate
];

module.exports = {
  validate,
  validateSignup,
  validateLogin,
  validateBookAppointment,
  validateSaveConsultation,
  validateCreateMedicine,
  validateDispenseMedicine,
  validateUpdateRole
};
