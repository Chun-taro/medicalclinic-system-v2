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
import { useTheme } from '../../context/ThemeContext';
import 'stream-chat-react/dist/css/v2/index.css';
import './AdminMessages.css';

import { useChatContext } from 'stream-chat-react';

const AdminMessagesContent = () => {
    const { channel: activeChannel, setActiveChannel, client } = useChatContext();
    const { user: currentUser } = useAuth();
    const isStationAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

    // Broaden filters for admins to see all messaging channels
    const filters = isStationAdmin 
        ? { type: 'messaging' } 
        : { type: 'messaging', members: { $in: [client.userID] } };

    return (
        <>
            <div className="messages-sidebar">
                <div className="sidebar-header">
                    <h2>Messages</h2>
                </div>
                <ChannelList 
                    filters={filters} 
                    sort={{ last_message_at: -1 }}
                    options={{ state: true, presence: true, limit: 10 }}
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
            </div>
            <div className="messages-content">
                <Channel>
                    <Window>
                        <ChannelHeader />
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
