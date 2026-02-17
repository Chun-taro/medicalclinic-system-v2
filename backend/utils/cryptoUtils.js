const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Recommended for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts sensitive data using AES-256-GCM.
 * @param {string} text - The plaintext to encrypt.
 * @param {string} secretKey - The 32-byte secret key.
 * @returns {string} - The encrypted data in format 'iv:authTag:encryptedText'
 */
const encrypt = (text, secretKey) => {
    if (!text) return text;
    if (!secretKey || secretKey.length !== 32) {
        throw new Error('Secret key must be a 32-character string');
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(secretKey), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypts data encrypted with AES-256-GCM.
 * @param {string} encryptedText - The encrypted data in format 'iv:authTag:encryptedText'
 * @param {string} secretKey - The 32-byte secret key.
 * @returns {string} - The decrypted plaintext.
 */
const decrypt = (encryptedText, secretKey) => {
    if (!encryptedText) return encryptedText;
    if (!secretKey || secretKey.length !== 32) {
        throw new Error('Secret key must be a 32-character string');
    }

    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    if (!ivHex || !authTagHex || !encrypted) {
        // Possibly legacy unencrypted data or malformed
        return encryptedText;
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(secretKey), iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
};

module.exports = { encrypt, decrypt };
