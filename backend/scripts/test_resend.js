const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const sendEmail = require('../utils/mailer');

async function testResend() {
  console.log('Testing Resend Integration...');
  console.log('Using API Key:', process.env.RESEND_API_KEY ? 'Present (starts with ' + process.env.RESEND_API_KEY.substring(0, 5) + '...)' : 'Missing');
  
  try {
    const result = await sendEmail({
      to: 'michaelangeloangeles0@gmail.com', // The user's email from their prompt
      subject: 'Resend Integration Test - Buksu Medical Clinic',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">Integration Successful!</h2>
          <p>This is a test email from the <strong>Buksu Medical Clinic Management System</strong> using the Resend API.</p>
          <p>Email delivery is now working correctly on Render.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <small style="color: #666;">Buksu Medical Clinic System | Sent: ${new Date().toLocaleString()}</small>
        </div>
      `
    });
    
    if (result) {
      console.log('TEST PASSED: Email successfully queued by Resend.');
      console.log('Result ID:', result.id);
    } else {
      console.log('TEST FAILED: No result returned from sendEmail.');
    }
  } catch (err) {
    console.error('TEST FAILED with error:', err.message);
  }
}

testResend();
