
const { LIBRARIES } = require('../utils/libraries');
const { APIS } = require('../utils/apis');

const sendEmail = require('../utils/mailer');

const getVersions = (req, res) => {
  res.json({ ok: true, packages: { libraries: LIBRARIES, apis: APIS } });
};

const sendTestEmail = async (req, res) => {
  try {
    // Safely access req.user
    const userEmail = req.user ? req.user.email : null;
    const email = userEmail || req.query.email;

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
    console.error('Test email failed:', err);

    // Diagnostic info (safe to expose to admin/system endpoint)
    const diagnostics = {
      error: err.message,
      code: err.code,
      stack: err.stack,
      env: {
        hasUser: !!process.env.EMAIL_USER,
        hasPass: !!process.env.EMAIL_PASS,
        passLength: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0,
        cleanedPassLength: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/["']|\s+/g, '').length : 0
      }
    };

    res.status(500).json(diagnostics);
  }
};

module.exports = { getVersions, sendTestEmail };
