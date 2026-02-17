const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/cryptoUtils');

const userSchema = new mongoose.Schema({
  //  Personal Info
  firstName: {
    type: String,
    required: function () {
      return !this.googleId;
    },
    trim: true
  },
  lastName: {
    type: String,
    required: function () {
      return !this.googleId;
    },
    trim: true
  },
  middleName: { type: String, trim: true },

  // Identification
  idNumber: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
    trim: true
  },

  //  Demographics
  sex: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'other'
  },
  civilStatus: {
    type: String,
    enum: ['single', 'married', 'widowed', 'divorced'],
    default: 'single'
  },
  birthday: { type: Date },
  age: { type: Number },

  //  Contact Information
  homeAddress: { type: String, trim: true },
  contactNumber: { type: String, trim: true },
  emergencyContact: {
    name: { type: String, trim: true },
    relationship: { type: String, trim: true },
    phone: { type: String, trim: true }
  },

  //  Medical Information
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    default: null
  },
  allergies: [{ type: String, trim: true }],
  medicalHistory: [{ type: String, trim: true }],
  currentMedications: [{ type: String, trim: true }],

  //  Family History
  familyHistory: {
    diabetes: { type: Boolean, default: false },
    hypertension: { type: Boolean, default: false },
    heartDisease: { type: Boolean, default: false },
    cancer: { type: Boolean, default: false },
    other: { type: String, trim: true }
  },

  // Personal-Social History
  personalSocialHistory: {
    smoking: { type: String, enum: ['yes', 'no'], default: 'no' },
    smokingSticks: { type: Number, default: 0 },
    drinking: { type: String, enum: ['yes', 'no'], default: 'no' },
    drinkingStartYear: { type: String, trim: true },
    drinkingFrequency: { type: String, trim: true }
  },

  // Past Medical History
  pastMedicalHistory: {
    asthma: { type: Boolean, default: false },
    heartProblems: { type: Boolean, default: false },
    seizures: { type: Boolean, default: false },
    pneumonia: { type: Boolean, default: false },
    typhoid: { type: Boolean, default: false },
    tuberculosis: { type: Boolean, default: false },
    chickenpox: { type: Boolean, default: false },
    measles: { type: Boolean, default: false },
    germanMeasles: { type: Boolean, default: false }
  },

  // Previous Admissions and Operations
  admissionCount: { type: Number, default: 0 },
  admissionReason: { type: String, trim: true },
  operationDate: { type: Date },
  operationProcedure: { type: String, trim: true },

  // Immunization History
  immunization: {
    BCG: { type: Boolean, default: false },
    HepatitisB: { type: Boolean, default: false },
    Polio: { type: Boolean, default: false },
    DPT: { type: Boolean, default: false },
    MMR: { type: Boolean, default: false },
    Chickenpox: { type: Boolean, default: false },
    AntiRabies: { type: Boolean, default: false },
    TetanusBooster: { type: Boolean, default: false }
  },
  lastAdmissionDate: { type: Date },
  lastAdmissionTypeLocation: { type: String, trim: true },

  //  Login Info
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function () {
      return !this.googleId;
    },
    minlength: 6
  },
  googleId: { type: String },

  // Google Calendar OAuth
  googleAccessToken: { type: String },
  googleRefreshToken: { type: String },

  //  Role
  role: {
    type: String,
    enum: ['patient', 'admin', 'doctor', 'nurse', 'superadmin'],
    default: 'patient'
  },

  //  Password Reset
  resetToken: String,
  resetTokenExpiry: Date,

  //  Profile Picture
  avatar: { type: String, default: '' },

  // Version for optimistic concurrency control
  version: { type: Number, default: 0 }
}, { timestamps: true });

// Encryption hooks for sensitive tokens
userSchema.pre('save', function (next) {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) return next();

  if (this.isModified('googleAccessToken') && this.googleAccessToken) {
    try {
      this.googleAccessToken = encrypt(this.googleAccessToken, secret);
    } catch (err) {
      return next(err);
    }
  }
  if (this.isModified('googleRefreshToken') && this.googleRefreshToken) {
    try {
      this.googleRefreshToken = encrypt(this.googleRefreshToken, secret);
    } catch (err) {
      return next(err);
    }
  }
  next();
});

userSchema.post('init', function (doc) {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) return;

  if (doc.googleAccessToken) {
    try {
      doc.googleAccessToken = decrypt(doc.googleAccessToken, secret);
    } catch (err) {
      console.error('Failed to decrypt googleAccessToken:', err.message);
    }
  }
  if (doc.googleRefreshToken) {
    try {
      doc.googleRefreshToken = decrypt(doc.googleRefreshToken, secret);
    } catch (err) {
      console.error('Failed to decrypt googleRefreshToken:', err.message);
    }
  }
});

module.exports = mongoose.model('User', userSchema);