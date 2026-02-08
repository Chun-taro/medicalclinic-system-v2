const Feedback = require('../models/Feedback');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const logActivity = require('../utils/logActivity');

/**
 * Submit feedback for an appointment
 * POST /api/feedback
 */
const submitFeedback = async (req, res) => {
  try {
    if (!req.user || !['patient','admin','superadmin','doctor'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only patients, doctors, admins, or superadmins can submit feedback' });
    }

    const { appointmentId, rating, comment, recipientId, recipientRole } = req.body;

    // Validate required fields
    if (!appointmentId || !rating) {
      return res.status(400).json({ error: 'appointmentId and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Verify the appointment exists and belongs to the patient
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Only enforce ownership if the submitter is the patient
    if (req.user.role === 'patient' && appointment.patientId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You can only submit feedback for your own appointments' });
    }

    // Check if feedback already exists for this appointment+recipient
    let existingFeedback = null;
    if (recipientId) {
      existingFeedback = await Feedback.findOne({ appointmentId, recipientId });
    } else {
      // No explicit recipient => ensure no feedback exists for this appointment at all
      existingFeedback = await Feedback.findOne({ appointmentId });
    }
    if (existingFeedback) {
      return res.status(400).json({ error: 'Feedback already submitted for this appointment/recipient' });
    }

    // Determine patientId for the feedback record
    const patientId = (req.user.role === 'patient') ? req.user.userId : appointment.patientId;

    // Determine recipient (who the feedback is for): prefer explicit recipient from request
    // Accept `recipientId` and `recipientRole` from the client (patient selects staff member).
    let finalRecipientId = null;
    let finalRecipientRole = null;

    if (recipientId) {
      // validate recipient exists
      const recip = await User.findById(recipientId);
      if (!recip) return res.status(404).json({ error: 'Selected recipient not found' });
      if (recipientRole && recip.role !== recipientRole) {
        // keep recipientRole in sync with stored role
        finalRecipientRole = recip.role;
      } else {
        finalRecipientRole = recipientRole || recip.role;
      }
      finalRecipientId = recip._id;
    } else {
      // fallback to appointment.doctorId when available
      if (appointment.doctorId) {
        finalRecipientId = appointment.doctorId;
        finalRecipientRole = 'doctor';
      }
    }

    // If no recipient determined yet, try to find a superadmin
    if (!finalRecipientId) {
      const superadmin = await User.findOne({ role: 'superadmin' });
      if (superadmin) {
        finalRecipientId = superadmin._id;
        finalRecipientRole = 'superadmin';
      }
    }

    // If submitter is admin/doctor/superadmin and no explicit recipient provided, record them as recipient
    if (!finalRecipientId && ['admin','superadmin','doctor','nurse'].includes(req.user.role)) {
      finalRecipientId = req.user.userId;
      finalRecipientRole = req.user.role;
    }

    // Create feedback
    const feedback = new Feedback({
      appointmentId,
      patientId,
      // preserve old doctorId for backward compatibility when recipientRole is doctor
      doctorId: finalRecipientRole === 'doctor' ? finalRecipientId : undefined,
      recipientId: finalRecipientId,
      recipientRole: finalRecipientRole,
      rating,
      comment: comment || ''
    });

    await feedback.save();

    // Log the activity (use structured logActivity object)
    await logActivity({
      adminId: (['admin','superadmin','doctor','nurse'].includes(req.user.role) ? req.user.userId : null),
      adminName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
      adminRole: req.user.role,
      action: (['admin','superadmin','doctor','nurse'].includes(req.user.role) ? 'create_feedback_by_admin' : 'create_feedback'),
      entityType: 'feedback',
      entityId: feedback._id,
      details: {
        appointmentId,
        patientId: req.user.userId,
        rating,
        comment: comment || '',
        userName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
        recipientId: finalRecipientId,
        recipientRole: finalRecipientRole
      }
    });

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (err) {
    console.error('Feedback submission error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all feedback for a doctor
 * GET /api/doctors/:doctorId/feedback
 */
const getDoctorFeedback = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Verify doctor exists
    const user = await User.findById(doctorId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch feedback addressing this recipient (support legacy doctorId field)
    const feedback = await Feedback.find({ $or: [ { recipientId: doctorId }, { doctorId: doctorId } ] })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('patientId', 'firstName lastName')
      .populate('appointmentId', 'appointmentDate purpose');

    const total = await Feedback.countDocuments({ $or: [ { recipientId: doctorId }, { doctorId: doctorId } ] });

    res.status(200).json({
      message: 'Doctor feedback retrieved successfully',
      feedback,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get feedback error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get average rating for a doctor
 * GET /api/doctors/:doctorId/rating
 */
const getDoctorRating = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Verify doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Calculate average rating
    const ObjectId = require('mongoose').Types.ObjectId;
    const result = await Feedback.aggregate([
      { $match: { $or: [ { recipientId: ObjectId(doctorId) }, { doctorId: ObjectId(doctorId) } ] } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: { $push: '$rating' }
        }
      }
    ]);

    if (result.length === 0) {
      return res.status(200).json({
        doctorId,
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
    }

    const data = result[0];
    // Count distribution of ratings
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    data.ratingDistribution.forEach((rating) => {
      distribution[rating]++;
    });

    res.status(200).json({
      doctorId,
      averageRating: Math.round(data.averageRating * 10) / 10,
      totalReviews: data.totalReviews,
      ratingDistribution: distribution
    });
  } catch (err) {
    console.error('Get rating error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get feedback for a specific appointment (patient verification)
 * GET /api/appointments/:appointmentId/feedback
 */
const getAppointmentFeedback = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const feedback = await Feedback.findOne({ appointmentId })
      .populate('patientId', 'firstName lastName')
      .populate('recipientId', 'firstName lastName role')
      .populate('doctorId', 'firstName lastName specialization');

    if (!feedback) {
      return res.status(404).json({ error: 'No feedback found for this appointment' });
    }

    res.status(200).json({
      message: 'Feedback retrieved successfully',
      feedback
    });
  } catch (err) {
    console.error('Get appointment feedback error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update feedback (by patient who submitted it)
 * PUT /api/feedback/:feedbackId
 */
const updateFeedback = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Only patients can update feedback' });
    }

    const { feedbackId } = req.params;
    const { rating, comment } = req.body;

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    if (feedback.patientId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You can only update your own feedback' });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (rating) feedback.rating = rating;
    if (comment !== undefined) feedback.comment = comment;
    feedback.updatedAt = new Date();

    await feedback.save();

    res.status(200).json({
      message: 'Feedback updated successfully',
      feedback
    });
  } catch (err) {
    console.error('Update feedback error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get overall feedback analytics
 * GET /api/feedback/analytics/overall
 */
const getFeedbackAnalytics = async (req, res) => {
  try {
    const ObjectId = require('mongoose').Types.ObjectId;

    // Get overall stats
    const totalFeedback = await Feedback.countDocuments();
    
    // Calculate average rating and distribution
    const ratingStats = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          ratingDistribution: { $push: '$rating' },
          allRatings: { $push: '$rating' }
        }
      }
    ]);

    // Get top recipients
    const topRecipients = await Feedback.aggregate([
      {
        $group: {
          _id: '$recipientId',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'recipientInfo'
        }
      }
    ]);

    // Get feedback trend (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const feedbackTrend = await Feedback.aggregate([
      {
        $match: { createdAt: { $gte: sevenDaysAgo } }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get role distribution
    const roleDistribution = await Feedback.aggregate([
      {
        $group: {
          _id: '$recipientRole',
          count: { $sum: 1 }
        }
      }
    ]);

    // Process rating distribution
    let distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (ratingStats.length > 0) {
      ratingStats[0].ratingDistribution.forEach((rating) => {
        distribution[rating]++;
      });
    }

    // Format top recipients response
    const formattedTopRecipients = topRecipients.map(item => ({
      recipientId: item._id,
      count: item.count,
      avgRating: Math.round(item.avgRating * 10) / 10,
      name: item.recipientInfo.length > 0 
        ? `${item.recipientInfo[0].firstName} ${item.recipientInfo[0].lastName}`
        : 'Unknown'
    }));

    res.status(200).json({
      message: 'Feedback analytics retrieved successfully',
      analytics: {
        totalFeedback,
        averageRating: ratingStats.length > 0 ? Math.round(ratingStats[0].averageRating * 10) / 10 : 0,
        ratingDistribution: distribution,
        topRecipients: formattedTopRecipients,
        feedbackTrend,
        roleDistribution
      }
    });
  } catch (err) {
    console.error('Get analytics error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  submitFeedback,
  getDoctorFeedback,
  getDoctorRating,
  getAppointmentFeedback,
  updateFeedback,
  getFeedbackAnalytics
};
