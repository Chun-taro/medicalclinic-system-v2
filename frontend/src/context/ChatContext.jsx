import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { connectStreamUser, disconnectStreamUser } from '../services/streamService';
import chatService from '../services/chatService';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const { user, role } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeChats, setActiveChats] = useState([]); 
    const [streamClient, setStreamClient] = useState(null);
    const [unreadTotal, setUnreadTotal] = useState(0);
    const [error, setError] = useState(null);
    useEffect(() => {
        let isSubscribed = true;

        const initChat = async () => {
            if (user) {
                try {
                    setError(null);
                    const { token: streamToken } = await chatService.getStreamToken();
                    if (isSubscribed) {
                        const client = await connectStreamUser(user, streamToken);
                        if (!client) {
                            setError('Failed to connect to Stream server. Check your API keys and internet connection.');
                            return;
                        }
                        setStreamClient(client);
                        setUnreadTotal(client.user.total_unread_count || 0);

                        // Listen for unread count changes
                        client.on('notification.message_new', () => {
                            setUnreadTotal(client.user.total_unread_count || 0);
                        });
                        client.on('notification.mark_read', () => {
                            setUnreadTotal(client.user.total_unread_count || 0);
                        });
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
            // Use the role from AuthContext directly if available, fallback to user object
            const currentRole = role || user?.role;
            const isStaff = currentRole === 'admin' || currentRole === 'superadmin';
            
            // Get current user ID, ensuring it's a string
            const currentUserId = streamClient.userID || (user?.userId || user?._id)?.toString();
            
            if (!currentUserId && !isStaff) {
                console.warn('ChatContext: No valid user ID found for non-staff query');
                return;
            }

            const filters = isStaff 
                ? { type: 'messaging' }
                : { members: { $in: [currentUserId] } };
            
            const sort = { last_message_at: -1 };
            const channels = await streamClient.queryChannels(filters, sort, {
                watch: true,
                state: true,
            });
            setConversations(channels);
        } catch (err) {
            console.error('Failed to fetch Stream channels', err);
        }
    }, [streamClient, user, role]);

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
