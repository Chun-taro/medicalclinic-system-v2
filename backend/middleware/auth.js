
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    let token = req.header('Authorization');

    // Extract token from Authorization header
    if (token && token.startsWith('Bearer ')) {
      token = token.slice(7); // remove "Bearer "
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    // Debug logging (remove in production)
    console.log('Incoming token:', token);

    // Validate token format
    if (!token || token.split('.').length !== 3) {
      console.warn('Malformed or missing token');
      return res.status(401).json({ error: 'Malformed or missing token' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    return res.status(401).json({ error: 'Token is not valid' });
  }
};

module.exports = { auth };