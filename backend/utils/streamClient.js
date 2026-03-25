const { StreamChat } = require('stream-chat');
const dotenv = require('dotenv');

dotenv.config();

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
    console.warn('Stream API Key or Secret is missing. Chat functionality may be limited.');
}

const serverClient = StreamChat.getInstance(apiKey, apiSecret);

module.exports = serverClient;
