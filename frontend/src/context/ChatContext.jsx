import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { connectStreamUser, disconnectStreamUser } from '../services/streamService';
import chatService from '../services/chatService';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeChats, setActiveChats] = useState([]); 
    const [streamClient, setStreamClient] = useState(null);
    const [unreadTotal, setUnreadTotal] = useState(0);
    const [error, setError] = useState(null);
    useEffect(() => {
        let isSubscribed = true;

        const initChat = async () => {
            console.log('ChatContext: initChat starting', { user: !!user });
            if (user) {
                try {
                    setError(null);
                    console.log('ChatContext: Fetching stream token...');
                    const { token: streamToken } = await chatService.getStreamToken();
                    console.log('ChatContext: Stream token received', !!streamToken);
                    if (isSubscribed) {
                        console.log('ChatContext: Connecting Stream user...');
                        const client = await connectStreamUser(user, streamToken);
                        if (!client) {
                            setError('Failed to connect to Stream server. Check your API keys and internet connection.');
                            return;
                        }
                        setStreamClient(client);
                        setUnreadTotal(client.user.total_unread_count || 0);

                        // Listen for unread count changes
                        client.on('notification.message_new', (event) => {
                            setUnreadTotal(client.user.total_unread_count || 0);
                        });
                        client.on('notification.mark_read', (event) => {
                            setUnreadTotal(client.user.total_unread_count || 0);
                        });

                        console.log('Stream Chat connected');
                    }
                } catch (err) {
                    console.error('Error initializing Stream Chat:', err);
                    setError(err.response?.data?.error || err.message || 'Failed to initialize chat');
                }
            }
        };

        initChat();

        return () => {
            isSubscribed = false;
            disconnectStreamUser();
        };
    }, [user]);

    const fetchConversations = useCallback(async () => {
        if (!streamClient) return;
        try {
            const isStaff = user?.role === 'admin' || user?.role === 'superadmin';
            const filters = isStaff 
                ? { type: 'messaging' }
                : { members: { $in: [streamClient.userID] } };
            
            const sort = { last_message_at: -1 };
            const channels = await streamClient.queryChannels(filters, sort, {
                watch: true,
                state: true,
            });
            setConversations(channels);
        } catch (err) {
            console.error('Failed to fetch Stream channels', err);
        }
    }, [streamClient, user]);

    useEffect(() => {
        if (streamClient) {
            fetchConversations();
            
            const handleEvent = (event) => {
                if (event.type === 'message.new' || event.type === 'notification.message_new') {
                    fetchConversations();
                }
            };

            streamClient.on(handleEvent);
            return () => streamClient.off(handleEvent);
        }
    }, [streamClient, fetchConversations]);

    const openChat = (conversation) => {
        setActiveChats(prev => {
            if (prev.find(c => c._id === conversation._id)) return prev;
            // Limit to 3 active chats maybe?
            if (prev.length >= 3) return [...prev.slice(1), conversation];
            return [...prev, conversation];
        });
    };

    const closeChat = (conversationId) => {
        setActiveChats(prev => prev.filter(c => c._id !== conversationId));
    };

    const startChatWithUser = async (targetUser) => {
        const targetId = (targetUser._id || targetUser.id || targetUser.userId)?.toString();
        if (!targetId) {
            console.error('startChatWithUser: No target ID found', targetUser);
            return;
        }
        
        // Try to find existing conversation in the current list
        const existing = conversations.find(c => {
            const members = Object.keys(c.state.members);
            return members.includes(targetId);
        });

        if (existing) {
            openChat({ _id: existing.id, participants: [user, targetUser] });
        } else {
            // Placeholder conversation object until first message is sent
            const placeholder = {
                _id: 'new-' + targetUser._id,
                participants: [user, targetUser],
                isNew: true,
                targetUser
            };
            openChat(placeholder);
        }
    };

    return (
        <ChatContext.Provider value={{
            conversations,
            activeChats,
            unreadTotal,
            openChat,
            closeChat,
            startChatWithUser,
            fetchConversations,
            streamClient,
            error
        }}>
            {children}
        </ChatContext.Provider>
    );
};
