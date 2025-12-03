const APIS = {
  'cloudinary': { locations: [{ location: 'backend', version: '^2.8.0' }] },
  'googleapis': { locations: [{ location: 'backend', version: '^166.0.0' }] },
  'nodemailer': { locations: [{ location: 'backend', version: '^7.0.9' }] },
  'passport-google-oauth20': { locations: [{ location: 'backend', version: '^2.0.0' }] },
  'open-meteo': { locations: [{ location: 'backend', version: 'N/A' }] },
  'puppeteer': { locations: [{ location: 'backend', version: '^24.30.0' }] }
};

module.exports = { APIS };
