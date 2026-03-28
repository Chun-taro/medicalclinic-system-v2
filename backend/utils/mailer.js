const axios = require('axios');

/**
 * Send email via Resend API (HTTP) to bypass Render's SMTP restrictions.
 * @param {Object} options - { to, subject, html }
 */
const sendEmail = async ({ to, subject, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.error('RESEND_API_KEY missing in .env');
    return;
  }

  console.log(`Attempting to send email via Resend to: ${to} with subject: ${subject}`);

  try {
    const response = await axios.post(
      'https://api.resend.com/emails',
      {
        from: 'Buksu Medical Clinic <onboarding@resend.dev>',
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        html: html,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Email sent successfully via Resend:', response.data);
    return response.data;
  } catch (err) {
    console.error('Email send failed via Resend. Error details:', err.response?.data || err.message);
    if (err.response?.status === 401) {
      console.error('Unauthorized: Please check if your RESEND_API_KEY is correct.');
    } else if (err.response?.status === 422) {
      console.error('Validation Error: Usually happens if the recipient list or from address is invalid.');
    }
  }
};

module.exports = sendEmail;