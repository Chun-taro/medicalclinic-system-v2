const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/["']|\s+/g, '') : ''
  }
});

const sendEmail = async ({ to, subject, html }) => {
  console.log(`Attempting to send email to: ${to} with subject: ${subject}`);

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Email credentials missing in .env');
    throw new Error('Email credentials are not configured on the server.');
  }

  const mailOptions = {
    from: `"Buksu Medical Clinic" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);
    return info;
  } catch (err) {
    console.error('Email send failed. Error details:', err.message);
    // Log more details if available
    if (err.code === 'EAUTH') {
      console.error('Authentication failed. Please check EMAIL_PASS (App Password) and EMAIL_USER.');
    }
    throw err;
  }
};


module.exports = sendEmail;