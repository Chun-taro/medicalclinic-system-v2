import React from 'react';
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
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import 'stream-chat-react/dist/css/v2/index.css';
import './AdminMessages.css';

const AdminMessages = () => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState([]);
    const [activeChannel, setActiveChannel] = React.useState(null);
    const { streamClient, error } = useChat();
    const { user: currentUser } = useAuth();

    if (error) {
        return (
            <div className="admin-messages-page loading error" style={{ flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--danger)' }}>{error}</p>
                <div style={{ fontSize: '0.85rem', maxWidth: '500px' }}>
                    <p>Possible solutions:</p>
                    <ul style={{ textAlign: 'left', marginTop: '0.5rem' }}>
                        <li>Verify your <b>Stream API Keys</b> in <code>.env</code> files.</li>
                        <li>Ensure the <b>Backend Server</b> is running.</li>
                        <li>If using HTTPS, visit <a href="https://localhost:5000/api/chat/token" target="_blank" rel="noopener noreferrer">this link</a> and accept the certificate.</li>
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

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.length >= 2) {
            const results = await chatService.searchUsers(query);
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    };

    const startNewChannel = async (targetUser) => {
        const targetId = (targetUser._id || targetUser.userId || targetUser.id).toString();
        const channel = streamClient.channel('messaging', {
            members: [streamClient.userID, targetId],
        });
        await channel.watch();
        setActiveChannel(channel);
        setSearchQuery('');
        setSearchResults([]);
    };

    const filters = { type: 'messaging', members: { $in: [streamClient.userID] } };
    const sort = { last_message_at: -1 };
    const options = { state: true, presence: true, limit: 10 };

    return (
        <div className="admin-messages-page">
            <Chat client={streamClient} theme="str-chat__theme-light">
                <div className="messages-sidebar">
                    <div className="sidebar-header">
                        <h2>Messages</h2>
                        <div className="admin-chat-search">
                            <input 
                                type="text" 
                                placeholder="Search users to start chat..." 
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                            {searchResults.length > 0 && (
                                <div className="admin-search-results">
                                    {searchResults.map(user => (
                                        <div 
                                            key={user._id} 
                                            className="search-result-item"
                                            onClick={() => startNewChannel(user)}
                                        >
                                            {user.firstName} {user.lastName}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <ChannelList 
                        filters={filters} 
                        sort={sort} 
                        options={options}
                        onSelect={(channel) => setActiveChannel(channel)}
                    />
                </div>
                <div className="messages-content">
                    <Channel channel={activeChannel}>
                        <Window>
                            <ChannelHeader />
                            <MessageList />
                            <MessageInput />
                        </Window>
                        <Thread />
                    </Channel>
                    {/* Fallback for no selected channel */}
                    {!activeChannel && (
                        <div className="no-channel-selected">
                            <p>Select a conversation or start a new one</p>
                        </div>
                    )}
                </div>
            </Chat>
        </div>
    );
};

export default AdminMessages;
