const express = require('express');
const router = express.Router();

const {
  bookAppointment,
  getPatientAppointments,
  getAllAppointments,
  deleteAppointment,
  approveAppointment,
  getMyAppointments,
  startConsultation,
  completeConsultation,
  generateReports,
  getConsultations,
  getMedicalCertificates,
  getConsultationById,
  updateAppointment,
  saveConsultation,
  prescribeMedicines,
  generateCertificatePDF
} = require('../controllers/appointmentController');

const { auth } = require('../middleware/auth');

//  Booking and patient routes
router.post('/book', auth, bookAppointment);
router.get('/patient/:patientId', auth, getPatientAppointments);
router.get('/my', auth, getMyAppointments);
router.patch('/:id', auth, updateAppointment);

//  Admin routes
router.get('/', auth, getAllAppointments);
router.delete('/:id', auth, deleteAppointment);
router.patch('/:id/approve', auth, approveAppointment);

//  Consultation routes
router.patch('/:id/start', auth, startConsultation);
router.patch('/:id/complete', auth, completeConsultation);
router.patch('/:id/consultation', auth, saveConsultation);
router.post('/:id/prescribe', auth, prescribeMedicines); 

//  Reporting and analytics
router.get('/reports', auth, generateReports);
router.get('/consultations', auth, getConsultations);
router.get('/medical-certificates', auth, getMedicalCertificates);
router.get('/consultations/:id', auth, getConsultationById);

//  Certificate generation
router.get('/:id/certificate-pdf', auth, generateCertificatePDF);

module.exports = router;