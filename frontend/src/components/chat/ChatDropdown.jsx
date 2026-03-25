import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import chatService from '../../services/chatService';

const ChatDropdown = ({ onClose }) => {
    const navigate = useNavigate();
    const { conversations, openChat, startChatWithUser, streamClient } = useChat();
    const { user: currentUser } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                setIsSearching(true);
                try {
                    const results = await chatService.searchUsers(searchQuery);
                    setSearchResults(results);
                } catch (err) {
                    console.error('Search failed', err);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const getOtherParticipant = (channel) => {
        const otherId = Object.keys(channel.state.members).find(id => id !== streamClient.userID);
        return channel.state.members[otherId]?.user;
    };

    return (
        <div className="dropdown-menu chat-dropdown">
            <div className="dropdown-header">
                <h3>Messages</h3>
            </div>
            
            {currentUser.role !== 'patient' && (
                <div className="chat-search-wrapper">
                    <div className="search-input-container">
                        <Search size={14} className="search-icon" />
                        <input 
                            type="text" 
                            placeholder={currentUser.role === 'patient' ? "Search for staff..." : "Search users..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>
            )}

            <div className="dropdown-content">
                {currentUser.role === 'patient' ? (
                    <div className="patient-chat-view" style={{ padding: '1rem' }}>
                        {conversations.length > 0 ? (
                            <div className="recent-chats">
                                <p className="section-title">Your Conversation</p>
                                {conversations.map(channel => {
                                    const other = getOtherParticipant(channel);
                                    if (!other) return null;
                                    const isStaff = other.role === 'admin' || other.role === 'superadmin';
                                    const lastMessage = channel.state.messages[channel.state.messages.length - 1];
                                    return (
                                        <div 
                                            key={channel.id} 
                                            className="chat-item"
                                            onClick={() => {
                                                openChat({ _id: channel.id, participants: [currentUser, other] });
                                                onClose();
                                            }}
                                        >
                                            <div className="chat-avatar">
                                                {isStaff ? <Activity size={16} /> : (other.image ? <img src={other.image} alt="" /> : other.name?.[0])}
                                            </div>
                                            <div className="chat-info">
                                                <div className="chat-name">{isStaff ? 'Clinic Staff' : other.name}</div>
                                                <div className="chat-last-msg">
                                                    {lastMessage?.text || 'No messages yet'}
                                                </div>
                                            </div>
                                            {channel.countUnread() > 0 && <div className="unread-dot"></div>}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                    Need help? Message our support team.
                                </p>
                                <button 
                                    className="btn-primary" 
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)' }}
                                    onClick={async () => {
                                        try {
                                            const staff = await chatService.getStaff(); 
                                            if (staff && staff.length > 0) {
                                                startChatWithUser(staff[0]);
                                            }
                                            onClose();
                                        } catch (err) {
                                            console.error('Failed to start chat', err);
                                        }
                                    }}
                                >
                                    Message Staff
                                </button>
                            </div>
                        )}
                    </div>
                ) : searchQuery.length >= 2 ? (
                    <div className="search-results">
                        <p className="section-title">Search Results</p>
                        {isSearching ? (
                            <p className="text-center p-3 text-muted">Searching...</p>
                        ) : searchResults.length === 0 ? (
                            <p className="text-center p-3 text-muted">No users found</p>
                        ) : (
                            searchResults.map(user => (
                                <div 
                                    key={user._id} 
                                    className="chat-item"
                                    onClick={() => {
                                        startChatWithUser(user);
                                        onClose();
                                    }}
                                >
                                    <div className="chat-avatar">
                                        {user.avatar ? <img src={user.avatar} alt="" /> : user.firstName[0]}
                                    </div>
                                    <div className="chat-info">
                                        <div className="chat-name">{user.firstName} {user.lastName}</div>
                                        <div className="chat-role">{user.role}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="recent-chats">
                        <p className="section-title">Recent Chats</p>
                        {conversations.length === 0 ? (
                            <p className="empty-state" style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                No conversations yet
                            </p>
                        ) : (
                            conversations.map(channel => {
                                const other = getOtherParticipant(channel);
                                if (!other) return null;
                                const lastMessage = channel.state.messages[channel.state.messages.length - 1];
                                return (
                                    <div 
                                        key={channel.id} 
                                        className="chat-item"
                                        onClick={() => {
                                            if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
                                                navigate(`/${currentUser.role}-messages`);
                                            } else {
                                                openChat({ _id: channel.id, participants: [currentUser, other] });
                                            }
                                            onClose();
                                        }}
                                    >
                                        <div className="chat-avatar">
                                            {other.image ? <img src={other.image} alt="" /> : other.name?.[0]}
                                        </div>
                                        <div className="chat-info">
                                            <div className="chat-name">{other.name}</div>
                                            <div className="chat-last-msg">
                                                {lastMessage?.text || 'No messages yet'}
                                            </div>
                                        </div>
                                        {channel.countUnread() > 0 && <div className="unread-dot"></div>}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatDropdown;
