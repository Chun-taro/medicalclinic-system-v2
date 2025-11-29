
const VERSIONS = {
  'axios': { locations: [{ location: 'backend', version: '^1.12.2' }] },
  'bcryptjs': { locations: [{ location: 'backend', version: '^3.0.2' }] },
  'cloudinary': { locations: [{ location: 'backend', version: '^2.8.0' }] },
  'cors': { locations: [{ location: 'backend', version: '^2.8.5' }] },
  'dotenv': { locations: [{ location: 'backend', version: '^17.2.3' }] },
  'express': { locations: [{ location: 'backend', version: '^5.1.0' }] },
  'express-session': { locations: [{ location: 'backend', version: '^1.18.2' }] },
  'googleapis': { locations: [{ location: 'backend', version: '^166.0.0' }] },
  'helmet': { locations: [{ location: 'backend', version: '^8.1.0' }] },
  'jsonwebtoken': { locations: [{ location: 'backend', version: '^9.0.2' }] },
  'mongoose': { locations: [{ location: 'backend', version: '^8.19.1' }] },
  'multer': { locations: [{ location: 'backend', version: '^2.0.2' }] },
  'nodemailer': { locations: [{ location: 'backend', version: '^7.0.9' }] },
  'passport': { locations: [{ location: 'backend', version: '^0.7.0' }] },
  'passport-google-oauth20': { locations: [{ location: 'backend', version: '^2.0.0' }] },
  'pdfkit': { locations: [{ location: 'backend', version: '^0.17.2' }] },
  'puppeteer': { locations: [{ location: 'backend', version: '^24.30.0' }] },
  'react-calendar': { locations: [{ location: 'backend', version: '^6.0.0' }] },
  'socket.io': { locations: [{ location: 'backend', version: '^4.8.1' }] }
};

const getVersions = (req, res) => {
  res.json({ ok: true, packages: VERSIONS });
};

module.exports = { getVersions };
