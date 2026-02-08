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
  lockAppointmentForEdit,
  unlockAppointmentForEdit
} = require('../controllers/appointmentController');

const { auth, requireRole } = require('../middleware/auth');

//  Booking and patient routes
router.post('/book', auth, bookAppointment);
router.get('/patient/:patientId', auth, getPatientAppointments);
router.get('/my', auth, getMyAppointments);
router.patch('/:id', auth, updateAppointment);

//  Admin/Doctor routes - require admin or doctor role
router.get('/', auth, requireRole('admin', 'doctor', 'superadmin'), getAllAppointments);
router.delete('/:id', auth, requireRole('admin', 'doctor', 'superadmin'), deleteAppointment);
router.patch('/:id/approve', auth, requireRole('admin', 'doctor', 'superadmin'), approveAppointment);

//  Concurrency control routes - require admin or doctor role
router.post('/:id/lock', auth, requireRole('admin', 'doctor', 'superadmin'), lockAppointmentForEdit);
router.post('/:id/unlock', auth, requireRole('admin', 'doctor', 'superadmin'), unlockAppointmentForEdit);

//  Consultation routes - require admin or doctor role
router.patch('/:id/start', auth, requireRole('admin', 'doctor', 'superadmin'), startConsultation);
router.patch('/:id/complete', auth, requireRole('admin', 'doctor', 'superadmin'), completeConsultation);
router.patch('/:id/consultation', auth, requireRole('admin', 'doctor', 'superadmin'), saveConsultation);
router.post('/:id/prescribe', auth, requireRole('admin', 'doctor', 'superadmin'), prescribeMedicines);

//  Reporting and analytics - require admin or doctor role
router.get('/reports', auth, requireRole('admin', 'doctor', 'superadmin'), generateReports);
router.get('/consultations', auth, requireRole('admin', 'doctor', 'superadmin'), getConsultations);
router.get('/medical-certificates', auth, requireRole('admin', 'doctor', 'superadmin'), getMedicalCertificates);
router.get('/consultations/:id', auth, requireRole('admin', 'doctor', 'superadmin'), getConsultationById);



module.exports = router;