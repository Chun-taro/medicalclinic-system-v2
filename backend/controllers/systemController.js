
const VERSIONS = {
  'passport-google-oauth20': { locations: [{ location: 'backend', version: '^2.0.0' }] },
  'google-auth-library': { locations: [{ location: 'root', version: '^10.5.0' }] },
  'googleapis': { locations: [{ location: 'root', version: '^164.1.0' }] },
  'nodemailer': { locations: [{ location: 'backend', version: '^7.0.9' }, { location: 'root', version: '^7.0.10' }] },
  'react-google-recaptcha': { locations: [{ location: 'frontend', version: '^3.1.0' }] },
  'react-calendar': { locations: [{ location: 'backend', version: '^6.0.0' }, { location: 'frontend', version: '^6.0.0' }] },
  'cloudinary': { locations: [{ location: 'root', version: '^2.8.0' }] }
};

const getVersions = (req, res) => {
  res.json({ ok: true, packages: VERSIONS });
};

module.exports = { getVersions };
