const morgan = require('morgan');
const logger = require('../utils/logger');

// Custom Morgan token for user ID
morgan.token('userId', (req) => req.user?.userId || 'anonymous');

// Custom Morgan token for request body (sensitive data filtered)
morgan.token('body', (req) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const body = { ...req.body };

    // Filter out sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'creditCard'];
    sensitiveFields.forEach(field => {
      if (body[field]) {
        body[field] = '[FILTERED]';
      }
    });

    return JSON.stringify(body);
  }
  return '';
});

// Morgan middleware with custom format
const requestLogger = morgan(
  ':date[iso] [:method] :url :status :response-time ms - :res[content-length] - User: :userId - IP: :remote-addr - Agent: :user-agent :body',
  {
    stream: {
      write: (message) => {
        // Parse the Morgan output and log with Winston
        const parts = message.trim().split(' ');
        const timestamp = parts[0];
        const method = parts[1].replace('[', '').replace(']', '');
        const url = parts[2];
        const status = parseInt(parts[3]);
        const responseTime = parseFloat(parts[4]);
        const contentLength = parts[6] || '0';
        const userId = parts[8];
        const ip = parts[10];
        const userAgent = parts.slice(12, -1).join(' '); // Everything between IP and body
        const body = parts[parts.length - 1];

        // Map status to level
        if (status >= 500) {
          logger.error(`HTTP ${status} [${method}] ${url} - Body: ${body}`);
        } else if (status >= 400) {
          logger.warn(`HTTP ${status} [${method}] ${url} - Body: ${body}`);
        } else {
          logger.info(`HTTP ${status} [${method}] ${url} - ${responseTime}ms`);
        }
      }
    },
    skip: (req, res) => {
      // Skip logging for health checks and static files
      return req.url === '/health' || req.url.startsWith('/static/');
    }
  }
);

module.exports = requestLogger;
