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

    const otherParticipant = conversation.participants?.find(p => 
        (p._id || p.id || p.userId) !== (currentUser.userId || currentUser._id)
    ) || conversation.targetUser;

    useEffect(() => {
        if (!streamClient || !conversation) return;

        const initChannel = async () => {
            try {
                setLoading(true);
                let newChannel;
                
                if (conversation.isNew) {
                    newChannel = streamClient.channel('messaging', {
                        members: [streamClient.userID, otherParticipant._id.toString()]
                    });
                } else {
                    newChannel = streamClient.channel('messaging', conversation._id);
                }

                await newChannel.watch();
                setChannel(newChannel);
                setMessages(newChannel.state.messages);

                newChannel.on('message.new', (event) => {
                    setMessages(prev => [...prev, event.message]);
                });

                await newChannel.markRead();
            } catch (err) {
                console.error('Failed to init channel:', err);
            } finally {
                setLoading(false);
            }
        };

        initChannel();
    }, [streamClient, conversation]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
                        const isMe = msg.user.id === streamClient.userID;
                        return (
                            <div key={index} className={`message ${isMe ? 'sent' : 'received'}`}>
                                <div className="message-content">{msg.text}</div>
                                <div className="message-time">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
