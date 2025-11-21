const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Medicine = require('../models/Medicine');
const { google } = require('googleapis');
const { sendNotification } = require('../utils/sendNotification');
const sendEmail = require('../utils/mailer');
const puppeteer = require('puppeteer');




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

    const appointment = new Appointment({
  patientId: req.user.userId,
  appointmentDate,
  purpose,
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
      .select('appointmentDate status purpose reasonForVisit typeOfVisit diagnosis management medicinesPrescribed consultationCompletedAt')
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
      .select('appointmentDate status purpose typeOfVisit patientId')
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
    const { status } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status },
      { new: true }
    ).populate('patientId');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const patient = appointment.patientId;

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

    res.json({ message: `Appointment ${status} and email sent.` });
  } catch (err) {
    console.error('Update appointment error:', err.message);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};


// Approve appointment
const approveAppointment = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    ).populate('patientId');

    if (!updated || !updated.patientId) {
      return res.status(404).json({ error: 'Appointment or patient not found' });
    }

    const patient = updated.patientId;

    // In-app notification
    await sendNotification({
      userId: patient._id,
      status: 'approved',
      message: `Your appointment on ${updated.appointmentDate.toDateString()} has been approved.`,
      recipientType: 'patient'
    });

    // Email notification
    if (patient.email) {
      try {
        await sendEmail({
          to: patient.email,
          subject: 'Your appointment has been approved',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2 style="color: #2E86C1;">Appointment Approved</h2>
              <p>Hi ${patient.firstName},</p>
              <p>Your appointment scheduled for <strong>${updated.appointmentDate.toDateString()}</strong> has been <strong>approved</strong>.</p>
              <p>Please arrive 10 minutes early and bring any necessary documents.</p>
              <p style="margin-top: 20px;">Thank you,<br/>Clinic Team</p>
            </div>
          `
        });
      } catch (emailErr) {
        console.error('Email send error:', emailErr.message);
        
      }
    }

    // Create Google Calendar event in patient's calendar if they have connected Google
    try {
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

      // Try to create the event as the patient (best UX)
      if (patient.googleRefreshToken || patient.googleAccessToken) {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );

        if (patient.googleRefreshToken) {
          // Use refresh token to obtain a fresh access token
          oauth2Client.setCredentials({ refresh_token: patient.googleRefreshToken });
          try {
            const access = await oauth2Client.getAccessToken();
            if (access && access.token) {
              oauth2Client.setCredentials({ access_token: access.token, refresh_token: patient.googleRefreshToken });
            }
          } catch (refreshErr) {
            // If refresh fails, throw to trigger fallback
            throw refreshErr;
          }
        } else {
          oauth2Client.setCredentials({ access_token: patient.googleAccessToken });
        }

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const resp = await calendar.events.insert({ calendarId: 'primary', resource: event });
        console.log('Google Calendar event created (patient):', resp.data.id);
      } else {
        // No patient tokens — fall through to clinic invite flow
        throw new Error('No patient Google tokens');
      }
    } catch (patientErr) {
      // Fallback: create event on clinic account and invite patient by email
      try {
        if (!patient.email) throw new Error('No patient email to invite');

        const clinicOauth = new google.auth.OAuth2(
          process.env.GOOGLE_CALENDAR_CLIENT_ID,
          process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
          process.env.GOOGLE_CALENDAR_REDIRECT_URI
        );

        if (process.env.GOOGLE_CALENDAR_REFRESH_TOKEN) {
          clinicOauth.setCredentials({ refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN });
          const access = await clinicOauth.getAccessToken();
          if (access && access.token) clinicOauth.setCredentials({ access_token: access.token, refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN });
        } else if (process.env.GOOGLE_CALENDAR_ACCESS_TOKEN) {
          clinicOauth.setCredentials({ access_token: process.env.GOOGLE_CALENDAR_ACCESS_TOKEN });
        } else {
          throw new Error('Clinic calendar credentials not configured');
        }

        const calendar = google.calendar({ version: 'v3', auth: clinicOauth });

        const startDate = new Date(updated.appointmentDate);
        const endDate = new Date(startDate.getTime() + (30 * 60 * 1000));

        const inviteEvent = {
          summary: 'Clinic Appointment',
          description: `Appointment for ${patient.firstName || ''} ${patient.lastName || ''} - ${updated.purpose || ''}`,
          start: { dateTime: startDate.toISOString(), timeZone: 'Asia/Manila' },
          end: { dateTime: endDate.toISOString(), timeZone: 'Asia/Manila' },
          attendees: [{ email: patient.email }],
          reminders: { useDefault: true }
        };

        const resp = await calendar.events.insert({ calendarId: 'primary', resource: inviteEvent, sendUpdates: 'all' });
        console.log('Google Calendar invite created (clinic):', resp.data.id);
      } catch (clinicErr) {
        console.error('Clinic calendar invite error:', clinicErr && clinicErr.message ? clinicErr.message : clinicErr);
        console.error('Patient calendar error:', patientErr && patientErr.message ? patientErr.message : patientErr);
      }
    }

    res.json({ message: 'Appointment approved and notification sent', appointment: updated });
  } catch (err) {
    console.error('Approval error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
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

    appointment.status = 'in-consultation';
    await appointment.save();

    sendNotification({
      userId: appointment.patientId,
      status: 'in-consultation',
      message: 'Your consultation has started',
      recipientType: 'patient'
    });

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
      consultationCompletedAt: req.body.consultationCompletedAt || new Date()
    };

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

    // Patient notification
    sendNotification({
      userId: appointment.patientId,
      status: 'completed',
      message: 'Your consultation has been completed',
      recipientType: 'patient'
    });

    // Admin notification
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      sendNotification({
        userId: admin._id,
        status: 'completed',
        message: `Consultation completed for patient ${appointment.firstName || ''} ${appointment.lastName || ''}`.trim(),
        recipientType: 'admin'
      });
    }

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

    const appointment = await Appointment.findById(id);
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
    const isOwner = String(appointment.patientId._id) === String(req.user.userId);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Track changes
    const changes = [];
    const allowedFields = ['appointmentDate', 'purpose', 'typeOfVisit', 'diagnosis'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== appointment[field]) {
        appointment[field] = req.body[field];
        changes.push(field);
      }
    });

    await appointment.save();

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
      if (changes.includes('typeOfVisit')) {
        message += ` Type of visit: ${appointment.typeOfVisit}.`;
        emailDetails += `<p><strong>Type of Visit:</strong> ${appointment.typeOfVisit}</p>`;
      }
      if (changes.includes('diagnosis')) {
        message += ` Diagnosis: ${appointment.diagnosis}.`;
        emailDetails += `<p><strong>Diagnosis:</strong> ${appointment.diagnosis}</p>`;
      }

      // In-app notification
      await sendNotification({
        userId: appointment.patientId._id,
        status: 'updated',
        message,
        recipientType: 'patient'
      });

      // Email notification (only if appointmentDate changed or admin triggered)
      if (appointment.patientId.email && (changes.includes('appointmentDate') || isAdmin)) {
        try {
          await sendEmail({
            to: appointment.patientId.email,
            subject: 'Your appointment has been updated',
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #E67E22;">Appointment Updated</h2>
                <p>Hi ${appointment.patientId.firstName},</p>
                <p>Your appointment has been updated with the following changes:</p>
                ${emailDetails}
                <p>If you have any questions, feel free to contact us.</p>
                <p style="margin-top: 20px;">Thank you,<br/>Clinic Team</p>
              </div>
            `
          });
        } catch (emailErr) {
          console.error('Email send error:', emailErr.message);
        }
      }
    }

    res.json({ message: 'Appointment updated', appointment });
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

const generateCertificatePDF = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate('patientId', 'firstName lastName');
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const patient = appointment.patientId;
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Mark appointment as completed when certificate is generated
    appointment.status = 'completed';
    appointment.consultationCompletedAt = new Date();
    await appointment.save();

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Medical Certificate</title>
        <style>
          body {
            font-family: 'Times New Roman', serif;
            margin: 40px;
            line-height: 1.6;
            color: #333;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          .content {
            flex: 1;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
          }
          .header h1 {
            font-size: 24px;
            margin-bottom: 10px;
          }
          .header p {
            font-size: 14px;
            margin: 5px 0;
          }
          .certificate-content {
            margin: 40px 0;
          }
          .certificate-content p {
            margin: 20px 0;
            font-size: 16px;
          }
          .footer {
            margin-top: auto;
            text-align: left;
          }
          .signature-section {
            margin-bottom: 20px;
          }
          .signature-line {
            border-bottom: 1px solid #000;
            width: 300px;
            margin-top: 10px;
            margin-bottom: 10px;
          }
          .date-section {
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="content">
          <div class="header">
            <h1>Medical Certificate</h1>
            <p>Medical Center Name</p>
            <p>Address Line 1</p>
            <p>City, State, ZIP Code</p>
            <p>Phone: (123) 456-7890</p>
          </div>

          <div class="certificate-content">
            <p>This is to certify that</p>
            <p><strong>${patient.firstName} ${patient.lastName}</strong></p>
            <p><strong>Purpose:</strong> ${appointment.purpose || 'Medical Certificate'}</p>
            <p><strong>Diagnosis:</strong> ${appointment.diagnosis || 'N/A'}</p>
            <p><strong>Fit to Work:</strong> ${appointment.fitToWork === 'yes' ? 'Yes' : appointment.fitToWork === 'no' ? 'No' : 'N/A'}</p>
            ${appointment.fitToWork === 'yes' ? `<p><strong>Fit to Work From:</strong> ${appointment.fitToWorkFrom ? new Date(appointment.fitToWorkFrom).toLocaleDateString() : 'N/A'}</p><p><strong>Fit to Work To:</strong> ${appointment.fitToWorkTo ? new Date(appointment.fitToWorkTo).toLocaleDateString() : 'N/A'}</p>` : ''}
            ${appointment.fitToWork === 'no' ? `<p><strong>Rest Days:</strong> ${appointment.restDays || 'N/A'}</p>` : ''}
            <p><strong>Remarks:</strong> ${appointment.remarks || 'N/A'}</p>
            <p>The examination was conducted on <strong>${appointment.consultationCompletedAt ? new Date(appointment.consultationCompletedAt).toLocaleDateString() : new Date().toLocaleDateString()}</strong>.</p>
            <p><strong>Report ID:</strong> ${appointment._id}</p>
          </div>
        </div>

        <div class="footer">
          <div class="signature-section">
            <p>Doctor's Signature:</p>
            <div class="signature-line"></div>
            <p>Dr. [Doctor's Name]</p>
            <p>License Number: [License #]</p>
          </div>

          <div class="date-section">
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="medical_certificate_${appointment._id}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation error:', err.message);
    res.status(500).json({ error: 'Failed to generate PDF' });
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
  saveConsultation,
  prescribeMedicines,
  generateCertificatePDF
};
