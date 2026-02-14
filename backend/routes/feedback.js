const express = require('express');
const router = express.Router();

const {
  submitFeedback,
  getDoctorFeedback,
  getDoctorRating,
  getAppointmentFeedback,
  updateFeedback,
  getFeedbackAnalytics,
  getAllFeedback
} = require('../controllers/feedbackController');

const { auth } = require('../middleware/auth');

// Patient routes
router.post('/', auth, submitFeedback);
router.get('/appointment/:appointmentId', auth, getAppointmentFeedback);
router.put('/:feedbackId', auth, updateFeedback);

// Analytics
router.get('/analytics/overall', getFeedbackAnalytics);

// Admin route to get all feedback
router.get('/all', auth, getAllFeedback);

// Public/Admin routes - Get doctor feedback and ratings
router.get('/doctor/:doctorId/feedback', getDoctorFeedback);
router.get('/doctor/:doctorId/rating', getDoctorRating);

module.exports = router;
