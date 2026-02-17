const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Medicine = require('../models/Medicine');
const { google } = require('googleapis');
const { sendNotification } = require('../utils/sendNotification');
const sendEmail = require('../utils/mailer');
const logActivity = require('../utils/logActivity');
const mongoose = require('mongoose');





// Book appointment
const bookAppointment = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Only patients can book appointments' });
    }

    const { appointmentDate, purpose } = req.body;
    if (!appointmentDate || !purpose) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Date validation: prevent past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(appointmentDate);
    if (bookingDate < today) {
      return res.status(400).json({ error: 'Cannot book appointments in the past' });
    }

    const appointment = new Appointment({
      patientId: req.user.userId,
      appointmentDate,
      purpose,
      additionalNotes: req.body.additionalNotes,
      reasonForVisit: req.body.reasonForVisit || purpose,
      typeOfVisit: req.body.typeOfVisit || 'scheduled'
    });

    await appointment.save();

    // Notify admin
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      sendNotification({
        userId: admin._id,
        status: 'pending',
        message: `New appointment booked by ${req.user.firstName || 'a patient'}`,
        recipientType: 'admin'
      });
    }

    // Notify patient
    sendNotification({
      userId: req.user.userId,
      status: 'pending',
      message: 'Your appointment request has been submitted and is pending approval.',
      recipientType: 'patient'
    });

    res.status(201).json({ message: 'Appointment booked successfully' });
  } catch (err) {
    console.error(' Booking error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

//  Get current patient's appointments
const getMyAppointments = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const page = parseInt(req.query.page, 10) || 0;
    const limit = parseInt(req.query.limit, 10) || 10;

    const appointments = await Appointment.find({ patientId: req.user.userId })
      .populate('patientId', 'firstName lastName email contactNumber')
      .populate('doctorId', 'firstName lastName role')
      .sort({ appointmentDate: -1 })
      .skip(page * limit)
      .limit(limit)
      .lean();

    res.json(appointments);
  } catch (err) {
    console.error(' Fetch my appointments error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

//  Get appointments for a specific patient
const getPatientAppointments = async (req, res) => {
  try {
    const requestedPatientId = req.params.patientId;
    const isAdmin = req.user.role === 'admin';
    const isSelf = String(req.user.userId) === String(requestedPatientId);

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Include management and medicinesPrescribed so the patient view shows consultation details
    const appointments = await Appointment.find({ patientId: requestedPatientId })
      .select('appointmentDate status purpose reasonForVisit typeOfVisit diagnosis management medicinesPrescribed consultationCompletedAt rescheduleReason')
      .sort({ appointmentDate: -1 })
      .lean();

    res.json(appointments);
  } catch (err) {
    console.error(' Patient appointments error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

//  Get all appointments (admin or superadmin only)
const getAllAppointments = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.role !== 'doctor' && req.user.role !== 'nurse') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const page = parseInt(req.query.page, 10) || 0;
    const limit = parseInt(req.query.limit, 10) || 20;

    const appointments = await Appointment.find()
      .populate('patientId', 'firstName lastName email contactNumber')
      .select('appointmentDate status purpose typeOfVisit patientId version additionalNotes')
      .sort({ appointmentDate: -1 })
      .skip(page * limit)
      .limit(limit)
      .lean();

    res.json(appointments);
  } catch (err) {
    console.error(' Admin fetch error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, version } = req.body;

    const appointment = await Appointment.findOneAndUpdate(
      { _id: appointmentId, version: version },
      { status, $inc: { version: 1 } },
      { new: true }
    ).populate('patientId');

    if (!appointment) {
      return res.status(409).json({ error: 'Appointment version conflict or not found' });
    }

    const patient = appointment.patientId;

    // Delete Google Calendar event if appointment is rejected/cancelled
    if (status === 'rejected' && appointment.googleCalendarEventId && patient) {
      try {
        if (patient.googleRefreshToken || patient.googleAccessToken) {
          const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
          );

          if (patient.googleRefreshToken) {
            oauth2Client.setCredentials({ refresh_token: patient.googleRefreshToken });
            const access = await oauth2Client.getAccessToken();
            if (access && access.token) {
              oauth2Client.setCredentials({ access_token: access.token, refresh_token: patient.googleRefreshToken });
            }
          } else {
            oauth2Client.setCredentials({ access_token: patient.googleAccessToken });
          }

          const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
          await calendar.events.delete({
            calendarId: 'primary',
            eventId: appointment.googleCalendarEventId
          });
          console.log('Google Calendar event deleted (patient):', appointment.googleCalendarEventId);

          // Clear the event ID from the appointment
          appointment.googleCalendarEventId = null;
          await appointment.save();
        }
      } catch (calendarErr) {
        console.error('Failed to delete Google Calendar event:', calendarErr.message);
      }
    }

    // Send email notification
    await sendEmail({
      to: patient.email,
      subject: `Your appointment has been ${status}`,
      html: `
        <p>Hi ${patient.firstName},</p>
        <p>Your appointment on <strong>${appointment.appointmentDate.toDateString()}</strong> has been <strong>${status}</strong>.</p>
        <p>Thank you,<br/>Clinic Team</p>
      `
    });

    res.json({ message: `Appointment ${status} and email sent.`, version: appointment.version });
  } catch (err) {
    console.error('Update appointment error:', err.message);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};


// Approve appointment with retry for transient write conflicts
const approveAppointment = async (req, res) => {
  const maxRetries = 3;
  let attempt = 0;

  const version = req.body?.version;

  while (attempt < maxRetries) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        await session.abortTransaction();
        session.endSession();
        return res.status(403).json({ error: 'Access denied' });
      }

      const updated = await Appointment.findOneAndUpdate(
        { _id: req.params.id, version: version },
        { status: 'approved', $inc: { version: 1 } },
        { new: true, session }
      ).populate('patientId');

      if (!updated || !updated.patientId) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ error: 'Appointment or patient not found' });
      }

      const patient = updated.patientId;

      await session.commitTransaction();
      session.endSession();

      // Return fast to the user
      res.json({ message: 'Appointment approved and processing notifications.', appointment: updated });

      // Run side effects in parallel (non-blocking)
      (async () => {
        try {
          // Log activity
          await logActivity({
            userId: req.user.userId,
            userName: req.user.name || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
            userRole: req.user.role,
            action: 'approve_appointment',
            entityType: 'appointment',
            entityId: updated._id,
            details: {
              patientName: `${patient.firstName} ${patient.lastName}`,
              appointmentDate: updated.appointmentDate
            }
          });

          // In-app notification
          await sendNotification({
            userId: patient._id,
            status: 'approved',
            message: `Your appointment on ${updated.appointmentDate.toDateString()} has been approved.`,
            recipientType: 'patient',
            appointmentId: updated._id
          });

          // Email notification
          if (patient.email) {
            sendEmail({
              to: patient.email,
              subject: 'Your appointment has been approved',
              html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #2E86C1;">Appointment Approved</h2>
                <p>Hi ${patient.firstName},</p>
                <p>Your appointment scheduled for <strong>${updated.appointmentDate.toDateString()}</strong> has been <strong>approved</strong>.</p>
                <p>Thank you,<br/>Clinic Team</p>
              </div>`
            }).catch(e => console.error('Email error:', e.message));
          } else {
            console.warn(`Skipping approval email: Patient ${patient._id} has no email address.`);
          }

          // Google Calendar
          if (patient.googleRefreshToken || patient.googleAccessToken) {
            const startDate = new Date(updated.appointmentDate);
            const endDate = new Date(startDate.getTime() + (30 * 60 * 1000));
            const event = {
              summary: 'Clinic Appointment',
              description: `Appointment for ${patient.firstName || ''} ${patient.lastName || ''} - ${updated.purpose || ''}`,
              start: { dateTime: startDate.toISOString(), timeZone: 'Asia/Manila' },
              end: { dateTime: endDate.toISOString(), timeZone: 'Asia/Manila' },
              attendees: patient.email ? [{ email: patient.email }] : [],
              reminders: { useDefault: true }
            };

            const oauth2Client = new google.auth.OAuth2(
              process.env.GOOGLE_CLIENT_ID,
              process.env.GOOGLE_CLIENT_SECRET,
              process.env.GOOGLE_REDIRECT_URI
            );

            if (patient.googleRefreshToken) {
              oauth2Client.setCredentials({ refresh_token: patient.googleRefreshToken });
              try {
                const access = await oauth2Client.getAccessToken();
                if (access && access.token) oauth2Client.setCredentials({ access_token: access.token, refresh_token: patient.googleRefreshToken });
              } catch (e) { }
            } else {
              oauth2Client.setCredentials({ access_token: patient.googleAccessToken });
            }

            const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
            const calResp = await calendar.events.insert({ calendarId: 'primary', resource: event });
            console.log('Google Calendar event created:', calResp.data.id);

            // Second, smaller update for event ID (non-blocking)
            await Appointment.findByIdAndUpdate(updated._id, { googleCalendarEventId: calResp.data.id });
          }
        } catch (sideErr) {
          console.error('Non-blocking side effect error:', sideErr.message);
        }
      })();

      return;
    } catch (err) {
      // Abort and decide whether to retry
      try { await session.abortTransaction(); } catch (e) { }
      session.endSession();

      const isTransient =
        (err && Array.isArray(err.errorLabels) && err.errorLabels.includes('TransientTransactionError')) ||
        (err && err.message && (err.message.includes('Write conflict') || err.message.includes('Please retry')));

      attempt += 1;
      if (attempt >= maxRetries || !isTransient) {
        console.error('Approval error:', err && err.message ? err.message : err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // small backoff before retrying
      await new Promise((r) => setTimeout(r, 100 * attempt));
      continue;
    }
  }
};


//  Start consultation
const startConsultation = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

    if (appointment.status !== 'approved') {
      return res.status(400).json({ error: 'Only approved appointments can begin consultation' });
    }

    // Mark caller as the clinician for this appointment so feedback targets them
    const clinicianRoles = ['doctor', 'admin', 'superadmin', 'nurse'];
    if (clinicianRoles.includes(req.user.role)) {
      appointment.doctorId = req.user.userId;
    }

    appointment.status = 'in-consultation';
    await appointment.save();

    // Run side effects
    (async () => {
      try {
        await sendNotification({
          userId: appointment.patientId,
          status: 'in-consultation',
          message: 'Your consultation has started',
          recipientType: 'patient',
          appointmentId: appointment._id
        });
      } catch (err) {
        console.error('Start consultation notification error:', err.message);
      }
    })();

    res.json({ message: 'Consultation started', appointment });
  } catch (err) {
    console.error(' Start consultation error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

//  Complete consultation
const completeConsultation = async (req, res) => {
  try {
    const updateFields = {
      ...req.body,
      status: 'completed',
      consultationCompletedAt: new Date() // Always set to current time when completing
    };

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    ).populate('patientId');

    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

    const patient = appointment.patientId;

    // Run side effects in parallel (non-blocking)
    (async () => {
      try {
        // Patient in-app notification
        await sendNotification({
          userId: patient._id || patient,
          status: 'completed',
          message: 'Your consultation has been completed',
          recipientType: 'patient',
          appointmentId: appointment._id
        });

        // Admin notification
        const admin = await User.findOne({ role: 'admin' });
        if (admin) {
          await sendNotification({
            userId: admin._id,
            status: 'completed',
            message: `Consultation completed for patient ${appointment.firstName || patient.firstName || ''} ${appointment.lastName || patient.lastName || ''}`.trim(),
            recipientType: 'admin',
            appointmentId: appointment._id
          });
        }

        // Email notification
        if (patient.email) {
          sendEmail({
            to: patient.email,
            subject: 'Consultation Completed',
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #27AE60;">Consultation Completed</h2>
                <p>Hi ${patient.firstName || appointment.firstName},</p>
                <p>Your consultation on <strong>${new Date(appointment.appointmentDate).toDateString()}</strong> has been completed.</p>
                <p>You can view your records and prescriptions in your portal.</p>
                <p>Thank you,<br/>Clinic Team</p>
              </div>
            `
          }).catch(e => console.error('Email consultation error:', e.message));
        }
      } catch (sideErr) {
        console.error('Non-blocking completion side effect error:', sideErr.message);
      }
    })();

    res.json(appointment);
    // Debug: log updated appointment to verify stored fields
    console.log('Appointment marked completed:', appointment);
  } catch (err) {
    console.error(' Completion error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const saveConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      diagnosis,
      management,
      medicinesPrescribed,
      bloodPressure,
      temperature,
      oxygenSaturation,
      heartRate,
      bmi,
      bmiIntervention,
      referredToPhysician,
      physicianName,
      firstAidDone,
      firstAidWithin30Mins,
      consultationCompletedAt
    } = req.body;

    const appointment = await Appointment.findById(id).populate('patientId');
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

    // Update all consultation fields
    appointment.diagnosis = diagnosis;
    appointment.management = management;
    appointment.medicinesPrescribed = medicinesPrescribed;
    appointment.bloodPressure = bloodPressure;
    appointment.temperature = temperature;
    appointment.oxygenSaturation = oxygenSaturation;
    appointment.heartRate = heartRate;
    appointment.bmi = bmi;
    appointment.bmiIntervention = bmiIntervention;
    appointment.referredToPhysician = referredToPhysician;
    appointment.physicianName = physicianName;
    appointment.firstAidDone = firstAidDone;
    appointment.firstAidWithin30Mins = firstAidWithin30Mins;
    appointment.status = 'completed';
    appointment.consultationCompletedAt = consultationCompletedAt || new Date();

    await appointment.save();

    const patient = appointment.patientId;

    // Run side effects in parallel (non-blocking)
    (async () => {
      try {
        // Log the activity
        await logActivity({
          userId: req.user.userId,
          userName: req.user.name || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
          userRole: req.user.role,
          action: 'complete_consultation',
          entityType: 'appointment',
          entityId: appointment._id,
          details: {
            patientName: `${patient?.firstName || appointment.firstName || ''} ${patient?.lastName || appointment.lastName || ''}`.trim(),
            diagnosis: diagnosis,
            medicinesCount: medicinesPrescribed?.length || 0
          }
        });

        // In-app notification
        await sendNotification({
          userId: patient?._id || appointment.patientId,
          status: 'completed',
          message: 'Your medical records have been updated.',
          recipientType: 'patient',
          appointmentId: appointment._id
        });

        // Email notification
        const emailTo = patient?.email || appointment.email;
        if (emailTo) {
          sendEmail({
            to: emailTo,
            subject: 'Consultation Records Updated',
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #2E86C1;">Medical Records Updated</h2>
                <p>Hi ${patient?.firstName || appointment.firstName},</p>
                <p>Your records for the consultation on <strong>${new Date(appointment.appointmentDate).toDateString()}</strong> have been updated and finalized.</p>
                <p>Diagnosis: ${diagnosis || 'N/A'}</p>
                <p>Thank you,<br/>Clinic Team</p>
              </div>
            `
          }).catch(e => console.error('Email save consultation error:', e.message));
        }
      } catch (sideErr) {
        console.error('Non-blocking save side effect error:', sideErr.message);
      }
    })();

    // Debug: log saved consultation to verify fields
    console.log('Consultation saved with vitals:', appointment);

    res.json({ message: 'Consultation saved', appointment });
  } catch (err) {
    console.error('Save consultation error:', err.message);
    res.status(500).json({ error: 'Failed to save consultation' });
  }
};


//  Delete appointment
const deleteAppointment = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const deleted = await Appointment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Appointment not found' });

    if (deleted) {
      // Run side effects
      (async () => {
        try {
          // Log the activity
          await logActivity({
            userId: req.user.userId,
            userName: req.user.name || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
            userRole: req.user.role,
            action: 'delete_appointment',
            entityType: 'appointment',
            entityId: deleted._id,
            details: {
              patientName: `${deleted.patientId?.firstName || ''} ${deleted.patientId?.lastName || ''}`.trim(),
              appointmentDate: deleted.appointmentDate
            }
          });

          // Notify patient (if they exist)
          if (deleted.patientId) {
            await sendNotification({
              userId: deleted.patientId._id || deleted.patientId,
              status: 'cancelled',
              message: `Your appointment on ${new Date(deleted.appointmentDate).toDateString()} has been cancelled by the administrator.`,
              recipientType: 'patient'
            });

            // Optional: Send email
            // if (deleted.patientId.email) { ... }
          }
        } catch (err) {
          console.error('Delete side effects error:', err.message);
        }
      })();
    }

    res.json({ message: 'Appointment deleted successfully' });
  } catch (err) {
    console.error(' Delete error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

//  Generate reports
const generateReports = async (req, res) => {
  try {
    const appointments = await Appointment.find().lean();

    const totalAppointments = appointments.length;
    const approved = appointments.filter(app => app.status === 'approved').length;
    const rejected = appointments.filter(app => app.status === 'rejected').length;
    const completed = appointments.filter(app => app.status === 'completed').length;

    const scheduled = appointments.filter(app => app.typeOfVisit === 'scheduled').length;
    const walkIn = appointments.filter(app => app.typeOfVisit === 'walk-in').length;

    const topDiagnosis = findMostCommon(appointments.map(app => app.diagnosis));
    const topComplaint = findMostCommon(appointments.map(app => app.purpose));
    const referralRate = Math.round(
      (appointments.filter(app => app.referredToPhysician).length / (totalAppointments || 1)) * 100
    );

    res.json({
      totalAppointments,
      approved,
      rejected,
      completed,
      scheduled,
      walkIn,
      topDiagnosis,
      topComplaint,
      referralRate
    });
  } catch (err) {
    console.error(' Report error:', err.message);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

//  Get consultations (only those with diagnosis)
const getConsultations = async (req, res) => {
  try {
    // Populate patient basic info (firstName, lastName) from User when available.
    const consultations = await Appointment.find({
      diagnosis: { $ne: null }
    })
      .populate('patientId', 'firstName lastName email contactNumber')
      .select(
        'patientId firstName lastName appointmentDate consultationCompletedAt chiefComplaint diagnosis management bloodPressure temperature heartRate oxygenSaturation bmi bmiIntervention medicinesPrescribed referredToPhysician physicianName firstAidDone firstAidWithin30Mins purpose'
      )
      .sort({ consultationCompletedAt: -1 })
      .lean();

    res.json(consultations);
  } catch (err) {
    console.error(' Consultations error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

//  Get medical certificates (purpose: 'Medical Certificate', status: 'completed')
const getMedicalCertificates = async (req, res) => {
  try {
    // Populate patient basic info (firstName, lastName) from User when available.
    const medicalCertificates = await Appointment.find({
      purpose: 'Medical Certificate',
      status: 'completed'
    })
      .populate('patientId', 'firstName lastName email contactNumber')
      .select(
        'patientId firstName lastName appointmentDate consultationCompletedAt purpose status diagnosis fitToWork fitToWorkFrom fitToWorkTo restDays remarks'
      )
      .sort({ consultationCompletedAt: -1 })
      .lean();

    res.json(medicalCertificates);
  } catch (err) {
    console.error(' Medical certificates error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

//  Get consultation by ID
const getConsultationById = async (req, res) => {
  try {
    const consultation = await Appointment.findById(req.params.id).lean();
    if (!consultation || !consultation.diagnosis) {
      return res.status(404).json({ error: 'Consultation not found' });
    }
    res.json(consultation);
  } catch (err) {
    console.error(' Consultation ID error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

//  Helper: most common value
function findMostCommon(arr) {
  const freq = {};
  arr.forEach(item => {
    if (item) freq[item] = (freq[item] || 0) + 1;
  });
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || 'N/A';
}

//  Update appointment (admin or patient)
const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate('patientId');
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const isAdmin = req.user.role === 'admin';
    const isSuperAdmin = req.user.role === 'superadmin';
    const isOwner = String(appointment.patientId._id) === String(req.user.userId);

    if (!isAdmin && !isSuperAdmin && !isOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Track changes
    const changes = [];
    const allowedFields = ['appointmentDate', 'purpose', 'typeOfVisit', 'diagnosis', 'status', 'rescheduleReason'];

    // Date validation if rescheduling
    if (req.body.appointmentDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newDate = new Date(req.body.appointmentDate);
      if (newDate < today) {
        return res.status(400).json({ error: 'Cannot reschedule to a past date' });
      }
    }

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== appointment[field]) {
        appointment[field] = req.body[field];
        changes.push(field);
      }
    });

    await appointment.save();

    // Return fast to the user
    res.json({ message: 'Appointment updated successfully', appointment });

    // Run side effects in parallel (non-blocking)
    (async () => {
      try {
        const isAdmin = req.user.role === 'admin';

        // Log reschedule activity if appointment date changed
        if (changes.includes('appointmentDate')) {
          await logActivity(
            req.user.userId,
            req.user.name || `${req.user.firstName} ${req.user.lastName}`,
            req.user.role,
            'reschedule_appointment',
            'appointment',
            appointment._id,
            {
              patientName: `${appointment.patientId?.firstName || ''} ${appointment.patientId?.lastName || ''}`.trim(),
              oldDate: appointment.appointmentDate, // This might be updated already, but logActivity will capture the current state
              newDate: req.body.appointmentDate
            }
          );
        }

        // Build notification message if something changed
        if (changes.length > 0) {
          let message = `Your appointment has been updated.`;
          let emailDetails = '';

          if (changes.includes('appointmentDate')) {
            const dateStr = new Date(appointment.appointmentDate).toLocaleDateString();
            message += ` New date: ${dateStr}.`;
            emailDetails += `<p><strong>New Date:</strong> ${dateStr}</p>`;
          }
          if (changes.includes('purpose')) {
            message += ` Purpose: ${appointment.purpose}.`;
            emailDetails += `<p><strong>Purpose:</strong> ${appointment.purpose}</p>`;
          }

          // In-app notification
          await sendNotification({
            userId: appointment.patientId._id,
            status: 'updated',
            message,
            recipientType: 'patient'
          });

          // Email notification
          if (appointment.patientId.email && (changes.includes('appointmentDate') || isAdmin)) {
            sendEmail({
              to: appointment.patientId.email,
              subject: 'Your appointment has been updated',
              html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #E67E22;">Appointment Updated</h2>
                <p>Hi ${appointment.patientId.firstName},</p>
                <p>Your appointment has been updated with the following changes:</p>
                ${emailDetails}
                <p>Thank you,<br/>Clinic Team</p>
              </div>`
            }).catch(e => console.error('Email update error:', e.message));
          }
        }
      } catch (err) {
        console.error('Non-blocking update side effects error:', err.message);
      }
    })();

    return;
  } catch (err) {
    console.error('Update error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const prescribeMedicines = async (req, res) => {
  const { id: consultationId } = req.params;
  const { prescribed } = req.body;

  if (!Array.isArray(prescribed) || prescribed.length === 0) {
    return res.status(400).json({ error: 'No medicines prescribed' });
  }

  try {
    for (const item of prescribed) {
      const med = await Medicine.findById(item.medicineId);
      if (!med || med.quantityInStock < item.quantity) continue;

      med.quantityInStock -= item.quantity;
      med.available = med.quantityInStock > 0;

      med.dispenseHistory.push({
        appointmentId: consultationId,
        quantity: item.quantity,
        dispensedBy: req.user.id,
        dispensedAt: new Date()
      });

      await med.save();
    }

    res.json({ message: 'Prescription processed' });
  } catch (err) {
    console.error('Prescription error:', err.message);
    res.status(500).json({ error: 'Failed to process prescription' });
  }
};

// Lock appointment for editing
const lockAppointmentForEdit = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate('editedBy', 'firstName lastName');
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.isBeingEdited) {
      if (String(appointment.editedBy._id) !== String(req.user.userId)) {
        const editorName = `${appointment.editedBy.firstName} ${appointment.editedBy.lastName}`;
        return res.status(409).json({
          error: 'Appointment is currently being edited by another user',
          editorName: editorName,
          editorId: appointment.editedBy._id
        });
      } else {
        // Already locked by this user, just return success
        return res.json({ message: 'Appointment already locked for editing' });
      }
    }

    appointment.isBeingEdited = true;
    appointment.editedBy = req.user.userId;
    await appointment.save();

    res.json({ message: 'Appointment locked for editing' });
  } catch (err) {
    console.error('Lock appointment error:', err.message);
    res.status(500).json({ error: 'Failed to lock appointment' });
  }
};

// Unlock appointment after editing
const unlockAppointmentForEdit = async (req, res) => {
  try {
    console.log('Unlock attempt for appointment:', req.params.id, 'by user:', req.user.userId, 'role:', req.user.role);
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      console.log('Appointment not found');
      return res.status(404).json({ error: 'Appointment not found' });
    }

    console.log('Appointment found:', appointment._id, 'isBeingEdited:', appointment.isBeingEdited, 'editedBy:', appointment.editedBy);

    if (!appointment.isBeingEdited) {
      console.log('Appointment is not locked');
      return res.json({ message: 'Appointment is not locked' });
    }

    // Allow unlock if the user is the one who locked it, or if they are admin/superadmin
    const isAdminOrSuper = req.user.role === 'admin' || req.user.role === 'superadmin';
    const isLocker = String(appointment.editedBy) === String(req.user.userId);

    console.log('isAdminOrSuper:', isAdminOrSuper, 'isLocker:', isLocker);

    if (!isAdminOrSuper && !isLocker) {
      console.log('Permission denied');
      return res.status(403).json({ error: 'You do not have permission to unlock this appointment' });
    }

    appointment.isBeingEdited = false;
    appointment.editedBy = null;
    await appointment.save();

    console.log('Appointment unlocked successfully');
    res.json({ message: 'Appointment unlocked' });
  } catch (err) {
    console.error('Unlock appointment error:', err.message);
    res.status(500).json({ error: 'Failed to unlock appointment' });
  }
};





module.exports = {
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
  updateAppointmentStatus,
  saveConsultation,
  prescribeMedicines,
  lockAppointmentForEdit,
  unlockAppointmentForEdit
}
