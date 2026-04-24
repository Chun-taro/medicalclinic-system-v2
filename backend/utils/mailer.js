const nodemailer = require('nodemailer');

/**
 * Send email via Nodemailer (Gmail) as requested to stop using Resend API.
 * @param {Object} options - { to, subject, html }
 */
const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"BukSU Medical Clinic" <${process.env.EMAIL_USER}>`,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject: subject,
    html: html
  };

  try {
    console.log(`Attempting to send email via Gmail to: ${to}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully via Gmail:', info.messageId);
    return info;
  } catch (err) {
    console.error('Email send failed via Gmail:', err.message);
  }
};

module.exports = sendEmail;