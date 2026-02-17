const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const sendEmail = require('../utils/mailer');

const testEmail = async () => {
    const email = 'chuntaro0430@gmail.com';
    console.log(`Attempting to send test email to ${email}...`);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('ERROR: EMAIL_USER or EMAIL_PASS not found in .env');
        return;
    }

    try {
        const info = await sendEmail({
            to: email,
            subject: 'Local Test Email - Debugging',
            html: '<h1>It works locally!</h1><p>If you see this, your local .env credentials are correct.</p>'
        });
        console.log('SUCCESS: Email sent!', info.messageId);
    } catch (error) {
        console.error('FAILURE: Could not send email.', error);
    }
};

testEmail();
