const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');

// Get all conversations for the current user
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id;
        const userRole = req.user.role;

        let query;
        if (userRole === 'admin' || userRole === 'superadmin') {
            // Admins see all conversations to pick up patient chats
            query = {}; 
        } else {
            query = { participants: userId };
        }

        const conversations = await Conversation.find(query)
            .populate('participants', 'firstName lastName avatar role')
            .populate({
                path: 'lastMessage',
                populate: { path: 'senderId', select: 'firstName lastName' }
            })
            .sort({ updatedAt: -1 });

        res.json(conversations);
    } catch (err) {
        console.error('Error fetching conversations:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get messages for a specific conversation
exports.getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const messages = await Message.find({ conversationId })
            .sort({ createdAt: 1 })
            .populate('senderId', 'firstName lastName avatar role');
        
        res.json(messages);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Send a message
exports.sendMessage = async (req, res) => {
    try {
        const senderId = req.user.userId || req.user._id;
        const { receiverId, content, conversationId } = req.body;

        let conversation;

        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
        } else if (receiverId) {
            // Validate receiverId is a valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(receiverId)) {
                return res.status(400).json({ error: 'Invalid receiver ID' });
            }

            // Find or create conversation for 1-on-1
            conversation = await Conversation.findOne({
                participants: { $all: [senderId, receiverId], $size: 2 }
            });

            if (!conversation) {
                conversation = new Conversation({
                    participants: [senderId, receiverId]
                });
                await conversation.save();
            }
        }

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        const newMessage = new Message({
            conversationId: conversation._id,
            senderId,
            content
        });

        await newMessage.save();

        console.log('Message saved, updating conversation...');

        // If sender is an admin/superadmin and not a participant, add them (claiming the chat)
        const isStaff = req.user.role === 'admin' || req.user.role === 'superadmin';
        const isAlreadyParticipant = conversation.participants.some(p => p.toString() === senderId.toString());
        
        if (isStaff && !isAlreadyParticipant) {
            console.log('Staff member claiming conversation:', senderId);
            conversation.participants.push(senderId);
        }

        // Update conversation last message and timestamp
        conversation.lastMessage = newMessage._id;
        conversation.updatedAt = Date.now();
        await conversation.save();

        // Emit real-time message via Socket.io
        const populatedMessage = await Message.findById(newMessage._id).populate('senderId', 'firstName lastName avatar role');
        
        console.log('Emitting message to participants:', conversation.participants);
        // Notify participants
        conversation.participants.forEach(participantId => {
            if (global.io && participantId) {
                global.io.to(participantId.toString()).emit('new_message', populatedMessage);
            }
        });

        // Also notify all staff if it's a patient message
        if (req.user.role === 'patient' && global.io) {
            global.io.to('staff').emit('new_message', populatedMessage);
        }

        res.status(201).json(populatedMessage);
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

// Mark conversation as read
exports.markAsRead = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.userId || req.user._id;

        await Message.updateMany(
            { conversationId, senderId: { $ne: userId }, read: false },
            { $set: { read: true }, $addToSet: { readBy: userId } }
        );

        res.json({ message: 'Conversation marked as read' });
    } catch (err) {
        console.error('Error marking as read:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get available staff members for patients
exports.getStaff = async (req, res) => {
    try {
        const staff = await User.find({ role: { $in: ['admin', 'superadmin'] } })
            .select('firstName lastName avatar role')
            .limit(5);
        res.json(staff);
    } catch (err) {
        console.error('Error fetching staff:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Search users to start a chat
exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        const userId = req.user.userId || req.user._id;
        const userRole = req.user.role;

        if (!query || query.length < 2) {
            return res.json([]);
        }

        let filter = {
            _id: { $ne: userId },
            $or: [
                { firstName: { $regex: query, $options: 'i' } },
                { lastName: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        };

        // If user is a patient, restrict search results to staff (admin/superadmin)
        if (userRole === 'patient') {
            filter.role = { $in: ['admin', 'superadmin'] };
        }

        const users = await User.find(filter).select('firstName lastName avatar role').limit(10);

        res.json(users);
    } catch (err) {
        console.error('Error searching users:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
// Get Stream Chat token for the current user
exports.getStreamToken = async (req, res) => {
    try {
        const userId = (req.user.userId || req.user._id).toString();
        const serverClient = require('../utils/streamClient');
        
        if (!process.env.STREAM_API_KEY) {
            return res.status(500).json({ error: 'Stream API not configured' });
        }

        const token = serverClient.createToken(userId);
        
        // Ensure user is synced with Stream (optional but good for metadata)
        const user = await User.findById(userId);

        // Map local roles to Stream roles (Stream only supports specific default roles)
        const streamRole = (user.role === 'admin' || user.role === 'superadmin') ? 'admin' : 'user';

        await serverClient.upsertUser({
            id: userId,
            name: `${user.firstName} ${user.lastName}`,
            role: streamRole,
            image: user.avatar
        });

        res.json({ token, apiKey: process.env.STREAM_API_KEY });
    } catch (err) {
        console.error('Error generating Stream token:', err);
        res.status(500).json({ 
            error: 'Failed to generate chat token', 
            details: err.message,
            stream_error: err.response?.data?.message 
        });
    }
};
