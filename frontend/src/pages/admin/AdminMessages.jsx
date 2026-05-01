import React, { useState, useEffect } from 'react';
import { 
    Chat, 
    Channel, 
    ChannelList, 
    Window, 
    ChannelHeader, 
    MessageList, 
    MessageInput, 
    Thread 
} from 'stream-chat-react';
import { Search } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import chatService from '../../services/chatService';
import 'stream-chat-react/dist/css/v2/index.css';
import './AdminMessages.css';
import { useChatContext } from 'stream-chat-react';

const CustomChannelHeader = () => {
    const { channel, client } = useChatContext();
    
    // Find the participant who is NOT an admin/staff (the patient)
    const members = Object.values(channel.state.members);
    const patientMember = members.find(m => 
        m.user.id !== client.userID && 
        m.user.role !== 'admin' && 
        m.user.role !== 'staff'
    ) || members.find(m => m.user.id !== client.userID);

    const displayName = patientMember?.user.name || 'Patient';
    const displayImage = patientMember?.user.image;

    return (
        <div className="custom-channel-header">
            <div className="header-info">
                <div className="header-avatar">
                   {displayImage ? <img src={displayImage} alt="" /> : (displayName[0] || '?')}
                </div>
                <div className="header-text">
                    <span className="header-name">{displayName}</span>
                    <span className="header-status">Patient Conversation</span>
                </div>
            </div>
        </div>
    );
};

const CustomChannelPreview = (props) => {
    const { channel, setActiveChannel, active } = props;
    const { client } = useChatContext();
    
    // Safety check for channel state
    if (!channel?.state?.members) return null;
    
    const members = Object.values(channel.state.members);
    const patientMember = members.find(m => 
        m.user.id !== client.userID && 
        m.user.role !== 'admin' && 
        m.user.role !== 'staff'
    ) || members.find(m => m.user.id !== client.userID);

    const displayName = patientMember?.user.name || 'Patient';
    
    const lastMessage = channel.state.messages[channel.state.messages.length - 1];
    
    return (
        <div className={`custom-channel-preview ${active ? 'active' : ''}`}
             onClick={() => setActiveChannel(channel)}>
            <div className="preview-avatar">
                {patientMember?.user.image ? <img src={patientMember.user.image} alt="" /> : (displayName[0] || '?')}
            </div>
            <div className="preview-content">
                <div className="preview-header">
                    <span className="preview-name">{displayName}</span>
                </div>
                <div className="preview-message">
                    {lastMessage?.text || 'No messages yet'}
                </div>
            </div>
        </div>
    );
};

const AdminMessagesContent = () => {
    const { channel: activeChannel, setActiveChannel, client } = useChatContext();
    const { user: currentUser } = useAuth();
    const { startChatWithUser, conversations } = useChat();
    const isStationAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Search logic
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

    // Broaden filters for admins to see all messaging channels
    const filters = isStationAdmin 
        ? { type: 'messaging' } 
        : { type: 'messaging', members: { $in: [client.userID] } };

    return (
        <>
            <div className="messages-sidebar">
                <div className="sidebar-header">
                    <h2>Messages</h2>
                    <div className="search-bar">
                        <Search size={18} className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search patients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="sidebar-scroll-area">
                    {searchQuery.length >= 2 ? (
                        <div className="search-results-overlay">
                            <p className="section-label">Search Results</p>
                            {isSearching ? (
                                <p className="loading-text">Searching...</p>
                            ) : searchResults.length === 0 ? (
                                <p className="no-results">No patients found</p>
                            ) : (
                                searchResults.map(user => (
                                    <div 
                                        key={user._id || user.id} 
                                        className="search-result-item"
                                        onClick={() => {
                                            startChatWithUser(user);
                                            setSearchQuery('');
                                        }}
                                    >
                                        <div className="result-avatar">
                                            {user.avatar ? <img src={user.avatar} alt="" /> : (user.firstName?.[0] || 'P')}
                                        </div>
                                        <div className="result-info">
                                            <div className="result-name">{user.firstName} {user.lastName}</div>
                                            <div className="result-role">{user.role}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <ChannelList 
                            filters={filters} 
                            sort={{ last_message_at: -1 }}
                            options={{ state: true, presence: true, limit: 10 }}
                            Preview={CustomChannelPreview}
                            onSelect={async (channel) => {
                                console.log('AdminMessages: onSelect', channel.id);
                                
                                // If admin is not a member, add them so they can "jump in"
                                if (isStationAdmin && !channel.state.members[client.userID]) {
                                    try {
                                        console.log('Admin joining channel:', channel.id);
                                        await channel.addMembers([client.userID]);
                                    } catch (err) {
                                        console.error('Failed to join channel:', err);
                                    }
                                }
                                
                                setActiveChannel(channel);
                            }}
                        />
                    )}
                </div>
            </div>
            <div className="messages-content">
                <Channel>
                    <Window>
                        <CustomChannelHeader />
                        <MessageList />
                        <MessageInput />
                    </Window>
                    <Thread />
                </Channel>
                {!activeChannel && (
                    <div className="no-channel-selected">
                        <p>Select a conversation or start a new one</p>
                    </div>
                )}
            </div>
        </>
    );
};

const AdminMessages = () => {
    const { streamClient, error } = useChat();
    const { isDarkMode } = useTheme();

    if (error) {
        return (
            <div className="admin-messages-page loading error" style={{ flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--danger)' }}>{error}</p>
                <div style={{ fontSize: '0.85rem', maxWidth: '500px' }}>
                    <p>Possible solutions:</p>
                    <ul style={{ textAlign: 'left', marginTop: '0.5rem' }}>
                        <li>Verify your <b>Stream API Keys</b> in <code>.env</code> files.</li>
                        <li>Ensure the <b>Backend Server</b> is running.</li>
                    </ul>
                </div>
            </div>
        );
    }

    if (!streamClient) {
        return (
            <div className="admin-messages-page loading">
                <p>Initializing chat...</p>
            </div>
        );
    }

    return (
        <div className="admin-messages-page">
            <Chat client={streamClient} theme={isDarkMode ? 'str-chat__theme-dark' : 'str-chat__theme-light'}>
                <AdminMessagesContent />
            </Chat>
        </div>
    );
};

export default AdminMessages;
