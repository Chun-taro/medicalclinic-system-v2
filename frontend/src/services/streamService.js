import { StreamChat } from 'stream-chat';

const apiKey = import.meta.env.VITE_STREAM_API_KEY;

let client;

export const getStreamClient = () => {
    if (!client) {
        if (!apiKey) {
            console.warn('VITE_STREAM_API_KEY is missing');
            return null;
        }
        client = StreamChat.getInstance(apiKey);
    }
    return client;
};

export const connectStreamUser = async (user, token) => {
    const streamClient = getStreamClient();
    if (!streamClient) return null;

    if (streamClient.userID) {
        await streamClient.disconnectUser();
    }

    try {
        await streamClient.connectUser(
            {
                id: (user.userId || user._id).toString(),
                name: `${user.firstName} ${user.lastName}`,
                image: user.avatar,
                role: user.role
            },
            token
        );
        return streamClient;
    } catch (err) {
        console.error('Failed to connect to Stream:', err);
        return null;
    }
};

export const disconnectStreamUser = async () => {
    if (client) {
        await client.disconnectUser();
    }
};
