import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Activity } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

const ChatWindow = ({ conversation }) => {
    const { closeChat, streamClient } = useChat();
    const { user: currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [channel, setChannel] = useState(null);
    const messagesEndRef = useRef(null);

    const otherParticipant = conversation.participants?.find(p => {
        const pId = (p._id || p.id || p.userId)?.toString();
        const currentId = (currentUser.userId || currentUser._id)?.toString();
        return pId !== currentId;
    }) || conversation.targetUser;

    useEffect(() => {
        if (!streamClient || !conversation) return;

        let activeChannel;
        const initChannel = async () => {
            try {
                setLoading(true);
                let newChannel;
                
                if (conversation.isNew) {
                    const otherId = (otherParticipant._id || otherParticipant.id || otherParticipant.userId)?.toString();
                    newChannel = streamClient.channel('messaging', {
                        members: [streamClient.userID, otherId]
                    });
                } else {
                    newChannel = streamClient.channel('messaging', conversation._id);
                }

                await newChannel.watch();
                activeChannel = newChannel;
                setChannel(newChannel);
                setMessages(newChannel.state.messages);

                const handleNewMessage = (event) => {
                    setMessages(prev => {
                        // Avoid duplication by checking if message already exists
                        if (prev.find(m => m.id === event.message.id)) return prev;
                        return [...prev, event.message];
                    });
                };

                newChannel.on('message.new', handleNewMessage);
                await newChannel.markRead();
                
                // Final scroll-to-bottom after load
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
                }, 100);

            } catch (err) {
                console.error('Failed to init channel:', err);
            } finally {
                setLoading(false);
            }
        };

        initChannel();

        return () => {
            if (activeChannel) {
                activeChannel.off('message.new');
            }
        };
    }, [streamClient, conversation, otherParticipant]);

    useEffect(() => {
        // Smooth scroll for subsequent messages
        if (messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !channel) return;

        try {
            await channel.sendMessage({ text: newMessage });
            setNewMessage('');
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };

    return (
        <div className="chat-window">
            <div className="chat-window-header">
                <div className="header-user">
                    <div className="window-avatar">
                        {(currentUser.role === 'patient') ? (
                            <Activity size={12} />
                        ) : otherParticipant?.avatar ? (
                            <img src={otherParticipant.avatar} alt="" />
                        ) : (
                            otherParticipant?.firstName?.[0] || '?'
                        )}
                    </div>
                    <span>
                        {(currentUser.role === 'patient')
                            ? 'Clinic Staff'
                            : `${otherParticipant?.firstName || 'User'} ${otherParticipant?.lastName || ''}`}
                    </span>
                </div>
                <div className="window-controls">
                    <button className="window-control-btn" onClick={() => closeChat(conversation._id)}>
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div className="chat-messages">
                {loading ? (
                    <p className="text-center p-3 text-muted">Loading...</p>
                ) : messages.length === 0 ? (
                    <div className="empty-chat-state" style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p>No messages yet. Send a message to start chatting!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const nextMsg = messages[index + 1];
                        const prevMsg = messages[index - 1];
                        const currentMsgUserId = msg.user?.id?.toString();
                        const nextMsgUserId = nextMsg?.user?.id?.toString();
                        const isMe = currentMsgUserId === streamClient?.userID?.toString();
                        
                        // Show footer (name/avatar) if it's the last message in a chain or time gap
                        const TIME_GAP = 5 * 60 * 1000;
                        const showFooter = !nextMsg || 
                                          nextMsgUserId !== currentMsgUserId || 
                                          (new Date(nextMsg.created_at) - new Date(msg.created_at)) > TIME_GAP;

                        const prevMsgUserId = prevMsg?.user?.id?.toString();
                        const isSameAsPrev = prevMsg && 
                                           prevMsgUserId === currentMsgUserId && 
                                           (new Date(msg.created_at) - new Date(prevMsg.created_at)) < TIME_GAP;
                        
                        const formatTimestamp = (dateStr) => {
                            const date = new Date(dateStr);
                            const now = new Date();
                            const isToday = date.toDateString() === now.toDateString();
                            const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
                            
                            if (isToday) return `Today at ${timeStr}`;
                            return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
                        };

                        return (
                            <div key={index} className={`message-group ${isMe ? 'sent' : 'received'} ${isSameAsPrev ? 'is-grouped' : ''}`}>
                                <div className="message-row">
                                    {!isMe && (
                                        <div className={`message-avatar ${!showFooter ? 'empty' : ''}`}>
                                            {showFooter ? (
                                                msg.user.image ? <img src={msg.user.image} alt="" /> : (msg.user.name?.[0] || '?')
                                            ) : null}
                                        </div>
                                    )}
                                    <div className="message-content-wrapper">
                                        <div className="message-content">{msg.text}</div>
                                        {showFooter && (
                                            <div className="message-info">
                                                <span className="message-username">{msg.user.name || 'User'}</span>
                                                <span className="message-date">{formatTimestamp(msg.created_at)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSend}>
                <input 
                    type="text" 
                    placeholder="Type a message..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;
