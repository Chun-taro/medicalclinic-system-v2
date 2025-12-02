const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../logs/app.log');

const logger = {
  info: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] INFO: ${message}\n`;
    console.log(logMessage.trim());
    fs.appendFileSync(logFilePath, logMessage);
  },
  error: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR: ${message}\n`;
    console.error(logMessage.trim());
    fs.appendFileSync(logFilePath, logMessage);
  },
  warn: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] WARN: ${message}\n`;
    console.warn(logMessage.trim());
    fs.appendFileSync(logFilePath, logMessage);
  }
};

module.exports = logger;
