const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  //  Link to patient
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Assigned clinician (doctor, nurse, admin who started consultation)
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Date and time tracking
  dateOfRequest: {
    type: Date,
    default: Date.now,
    description: 'Timestamp when the appointment request was submitted'
  },

  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'in-consultation', 'completed'],
    default: 'pending'
  },

  //  Patient booking fields
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  address: String,
  purpose: String,
  appointmentDate: Date,
  additionalNotes: String,

  //  Clinical and administrative fields
  date: Date,
  time: String,
  typeOfVisit: {
    type: String,
    enum: ['scheduled', 'walk-in', 'rescheduled']
  },
  patientNo: String,
  dateOfBirth: Date,
  age: Number,
  nationality: String,
  ethnicity: String,
  religion: String,
  sex: String,
  contact: String,
  campus: {
    type: String,
    enum: ['main', 'satellite']
  },
  courseAndYear: String,
  reasonForVisit: String,
  chiefComplaint: String,
  covidVaccinationStatus: String,
  allergies: String,
  requestedDate: Date,

  //  Vitals
  bloodPressure: String,
  temperature: String,
  oxygenSaturation: String,
  heartRate: String,
  bmi: String,
  bmiIntervention: String,
  height: String,
  weight: String,
  pulseRate: String,
  respiratoryRate: String,
  lmp: String,

  // Visual Acuity
  visualAcuityOS: String,
  visualAcuityOD: String,

  //  Diagnosis and management
  diagnosis: String,
  management: String,
  remarks: String,
  externalPrescription: String,
  p_age: String,
  p_sex: String,
  p_address: String,
  p_course: String,
  p_civilStatus: String,

  // Certificate Specifics
  issuedFor: String,
  isFit: { type: Boolean, default: true },
  validForAY: String,
  validForSemester: String,
  certificateType: { type: String, enum: ['normal', 'pathologic'], default: 'normal' },

  medicinesPrescribed: [
    {
      name: String,
      quantity: Number
    }
  ],
  availableInClinic: Boolean,
  quantity: Number,

  // Referrals
  referredToPhysician: Boolean,
  physicianName: String,
  referredToExternalFaculty: Boolean,
  timeReferred: String,
  referredWithin1Hour: {
    type: String,
    enum: ['y', 'n']
  },

  //  First aid
  firstAidDone: {
    type: String,
    enum: ['y', 'n']
  },
  firstAidWithin30Mins: {
    type: String,
    enum: ['y', 'n', 'n/a']
  },

  //  Consultation tracking
  consultationCompletedAt: Date,

  // Reschedule tracking
  rescheduleReason: String,

  // Google Calendar integration
  googleCalendarEventId: String,

  // Version for optimistic concurrency control
  version: { type: Number, default: 0 },

  // Concurrency control for editing
  isBeingEdited: { type: Boolean, default: false },
  editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });


// Indexes for common query patterns
appointmentSchema.index({ patientId: 1, status: 1 });
appointmentSchema.index({ appointmentDate: -1 });
appointmentSchema.index({ status: 1, appointmentDate: -1 });
appointmentSchema.index({ doctorId: 1, status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);