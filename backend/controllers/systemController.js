
const { LIBRARIES } = require('../utils/libraries');
const { APIS } = require('../utils/apis');

const sendEmail = require('../utils/mailer');

const getVersions = (req, res) => {
  res.json({ ok: true, packages: { libraries: LIBRARIES, apis: APIS } });
};

const sendTestEmail = async (req, res) => {
  try {
    const email = req.user.email || req.query.email; // Use logged in user's email or query param (for flexibility)

    if (!email) {
      return res.status(400).json({ error: 'No email address found for user.' });
    }

    console.log(`Sending test email to ${email}...`);

    await sendEmail({
      to: email,
      subject: 'Test Email - System Verification',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #27AE60;">Email System Working!</h2>
          <p>This is a test email triggered from the system diagnostics.</p>
          <p>If you are reading this, your email configuration (SMTP) is correct.</p>
          <p><strong>Time:</strong> ${new Date().toString()}</p>
        </div>
      `
    });

    res.json({ message: `Test email sent successfully to ${email}` });
  } catch (err) {
    console.error('Test email failed:', err.message);
    res.status(500).json({ error: 'Failed to send test email: ' + err.message });
  }
};

module.exports = { getVersions, sendTestEmail };
