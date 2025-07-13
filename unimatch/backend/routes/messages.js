const express = require('express');
const router = express.Router();
const multer = require('multer');
const Message = require('../models/Message');
const Match = require('../models/Match');
const Team = require('../models/Team');
const { protect } = require('../middleware/authMiddleware');
const cloudinary = require('../config/cloudinaryConfig');

// Configure multer for image uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image file.'), false);
        }
    },
});

// Helper function to check if user is a member of a team involved in the match
const isUserInMatch = async (matchId, userId) => {
    const match = await Match.findById(matchId).populate('requestingTeam receivingTeam');
    if (!match) return false;
    const requestingTeam = match.requestingTeam;
    const receivingTeam = match.receivingTeam;
    const isMember = requestingTeam.members.some(m => m.equals(userId)) || receivingTeam.members.some(m => m.equals(userId));
    return isMember;
};


// @desc    Get all messages for a specific match
// @route   GET /api/messages/:matchId
// @access  Private (Users part of the match only)
router.get('/:matchId', protect, async (req, res, next) => {
    const matchId = req.params.matchId;
    const userId = req.user.id;

    try {
        // Authorization: Check if user is part of this match
        const userIsInMatch = await isUserInMatch(matchId, userId);
        if (!userIsInMatch) {
            return res.status(403).json({ message: 'Not authorized to view messages for this match.' });
        }

        // Fetch messages, sorted by timestamp (oldest first)
        const messages = await Message.find({ match: matchId })
            .populate('sender', 'name') // Populate sender's name
            .sort({ createdAt: 1 }); // Sort ascending

        res.json(messages);

    } catch (err) {
        next(err);
    }
});

// @desc    Get private messages between the logged-in user and another user
// @route   GET /api/messages/private/:otherUserId
// @access  Private
router.get('/private/:otherUserId', protect, async (req, res, next) => {
    const loggedInUserId = req.user.id;
    const otherUserId = req.params.otherUserId;

    if (loggedInUserId === otherUserId) {
        return res.status(400).json({ message: 'Cannot fetch private messages with yourself.' });
    }

    try {
        // Find messages where the pair (loggedInUserId, otherUserId) is either (sender, recipient) or (recipient, sender)
        // and isPrivate is true.
        const messages = await Message.find({
            isPrivate: true,
            $or: [
                { sender: loggedInUserId, recipient: otherUserId },
                { sender: otherUserId, recipient: loggedInUserId }
            ]
        })
        .populate('sender', 'name') // Populate sender's name
        .populate('recipient', 'name') // Optionally populate recipient name too
        .sort({ createdAt: 1 }); // Sort ascending

        console.log(`Fetched ${messages.length} private messages between users ${loggedInUserId} and ${otherUserId}`);

        // Optional: Add authorization check - e.g., ensure these users are part of *some* mutual accepted match?
        // For now, we'll verify they have at least one mutual match
        const mutualMatches = await Match.find({
            status: 'accepted',
            $or: [
                { 
                    'requestingTeam': { $in: await getTeamIdsByUserId(loggedInUserId) },
                    'receivingTeam': { $in: await getTeamIdsByUserId(otherUserId) }
                },
                { 
                    'requestingTeam': { $in: await getTeamIdsByUserId(otherUserId) },
                    'receivingTeam': { $in: await getTeamIdsByUserId(loggedInUserId) }
                }
            ]
        });

        if (mutualMatches.length === 0) {
            return res.status(403).json({ message: 'You can only send private messages to users from matched teams.' });
        }

        res.json(messages);

    } catch (err) {
        console.error('Error fetching private messages:', err);
        next(err);
    }
});

// Helper function to get team IDs for a user
async function getTeamIdsByUserId(userId) {
    const teams = await Team.find({ members: userId }).select('_id');
    return teams.map(team => team._id);
}

// @desc    Upload image for message
// @route   POST /api/messages/upload-image
// @access  Private
router.post('/upload-image', protect, upload.single('image'), async (req, res, next) => {
    try {
        console.log('Image upload request received:', {
            body: req.body,
            fileInfo: req.file ? {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            } : 'No file',
            userId: req.user.id
        });

        const { matchId, teamId, isPrivate, recipientId, isTeamChat } = req.body;
        const userId = req.user.id;

        // Validate required fields - either matchId (for match chats) or teamId (for team chats)
        if (!matchId && !teamId) {
            console.log('Validation failed: Either Match ID or Team ID is required');
            return res.status(400).json({ message: 'Either Match ID or Team ID is required' });
        }
        
        if (matchId && teamId) {
            console.log('Validation failed: Cannot specify both Match ID and Team ID');
            return res.status(400).json({ message: 'Cannot specify both Match ID and Team ID' });
        }

        if (!req.file) {
            console.log('Validation failed: No file uploaded');
            return res.status(400).json({ message: 'Please upload an image file' });
        }

        if (isPrivate === 'true' && !recipientId) {
            console.log('Validation failed: Recipient ID is required for private messages');
            return res.status(400).json({ message: 'Recipient ID is required for private messages' });
        }
        
        if (teamId && isPrivate === 'true') {
            console.log('Validation failed: Team chats do not support private messages');
            return res.status(400).json({ message: 'Team chats do not support private messages' });
        }

        // Authorization: Check if user is part of this match or team
        if (matchId) {
            const userIsInMatch = await isUserInMatch(matchId, userId);
            if (!userIsInMatch) {
                return res.status(403).json({ message: 'Not authorized to send messages in this match.' });
            }
        } else if (teamId) {
            const Team = require('../models/Team');
            const team = await Team.findById(teamId);
            if (!team) {
                return res.status(404).json({ message: 'Team not found.' });
            }
            const isTeamMember = team.members.some(memberId => 
                memberId.equals ? memberId.equals(userId) : memberId.toString() === userId.toString()
            );
            if (!isTeamMember) {
                return res.status(403).json({ message: 'Not authorized to send messages in this team.' });
            }
        }

        // Check if Cloudinary is properly configured
        const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                     process.env.CLOUDINARY_API_KEY && 
                                     process.env.CLOUDINARY_API_SECRET &&
                                     process.env.CLOUDINARY_CLOUD_NAME !== 'demo_cloud' &&
                                     process.env.CLOUDINARY_API_KEY !== 'demo_key' &&
                                     process.env.CLOUDINARY_API_SECRET !== 'demo_secret';

        if (!isCloudinaryConfigured) {
            console.log('⚠️ Cloudinary not configured, using local storage fallback');
            
            // Create local uploads directory if it doesn't exist
            const fs = require('fs');
            const path = require('path');
            const uploadsDir = path.join(__dirname, '../uploads/chat_images');
            
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            // Generate unique filename
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 15);
            const fileExtension = path.extname(req.file.originalname);
            const filename = `${timestamp}_${randomString}${fileExtension}`;
            const filepath = path.join(uploadsDir, filename);

            try {
                // Save file locally
                fs.writeFileSync(filepath, req.file.buffer);
                
                // Create message with local file attachment
                const messageData = {
                    sender: userId,
                    messageType: 'image',
                    attachment: {
                        url: `/uploads/chat_images/${filename}`, // Local URL
                        publicId: filename, // Use filename as ID for local storage
                        filename: req.file.originalname,
                        size: req.file.size,
                        width: null, // We'll calculate this later if needed
                        height: null,
                    },
                    isPrivate: isPrivate === 'true',
                };

                // Set either match or teamChat reference
                if (matchId) {
                    messageData.match = matchId;
                } else if (teamId) {
                    const TeamChat = require('../models/TeamChat');
                    let teamChat = await TeamChat.findOne({ team: teamId });
                    if (!teamChat) {
                        const team = await Team.findById(teamId);
                        teamChat = new TeamChat({
                            team: teamId,
                            createdBy: team.createdBy,
                            isActive: true
                        });
                        await teamChat.save();
                    }
                    messageData.teamChat = teamChat._id;
                    messageData.isPrivate = false; // Team chats don't support private messages
                }

                if (isPrivate === 'true' && matchId) {
                    messageData.recipient = recipientId;
                }

                const message = new Message(messageData);
                await message.save();
                
                // Populate sender info for response
                await message.populate('sender', 'name');

                console.log(`Image message saved locally: ${filename}`);
                
                // Emit the message via Socket.IO for real-time delivery
                const io = req.app.get('socketio');
                if (io) {
                    const messageToEmit = {
                        _id: message._id,
                        sender: { _id: message.sender._id, name: message.sender.name },
                        messageType: 'image',
                        attachment: message.attachment,
                        timestamp: message.createdAt,
                        isPrivate: message.isPrivate,
                        recipient: message.isPrivate ? { _id: message.recipient } : undefined,
                        createdAt: message.createdAt
                    };

                    if (matchId) {
                        messageToEmit.matchId = matchId;
                        if (message.isPrivate && recipientId) {
                            // Send to specific recipient for private messages
                            io.emit('privateImageMessage', messageToEmit);
                        } else {
                            // Broadcast to room for group messages
                            io.to(matchId).emit('receiveMessage', messageToEmit);
                        }
                        console.log(`Socket.IO: Image message broadcast for match ${matchId}`);
                    } else if (teamId) {
                        messageToEmit.teamId = teamId;
                        // Broadcast to team room
                        const teamRoomId = `team_${teamId}`;
                        io.to(teamRoomId).emit('receiveTeamMessage', messageToEmit);
                        console.log(`Socket.IO: Team image message broadcast for team ${teamId}`);
                    }
                }
                
                res.status(201).json(message);

            } catch (localError) {
                console.error('Local file save error:', localError);
                res.status(500).json({ message: 'Error saving image locally' });
            }
            
            return; // Exit early for local storage
        }

        // Upload image to Cloudinary (existing code)
        console.log('Starting Cloudinary upload...');
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `unimatch/chat_images/${matchId}`,
                resource_type: 'image',
                transformation: [
                    { width: 800, height: 600, crop: 'limit', quality: 'auto' }
                ]
            },
            async (error, result) => {
                if (error) {
                    console.error('Cloudinary Upload Error:', error);
                    return res.status(500).json({ 
                        message: 'Error uploading image to cloud storage',
                        details: error.message || 'Unknown Cloudinary error'
                    });
                }

                console.log('Cloudinary upload successful:', {
                    public_id: result.public_id,
                    secure_url: result.secure_url,
                    width: result.width,
                    height: result.height
                });

                try {
                    // Create message with image attachment
                    const messageData = {
                        sender: userId,
                        messageType: 'image',
                        attachment: {
                            url: result.secure_url,
                            publicId: result.public_id,
                            filename: req.file.originalname,
                            size: req.file.size,
                            width: result.width,
                            height: result.height,
                        },
                        isPrivate: isPrivate === 'true',
                    };

                    // Set either match or teamChat reference
                    if (matchId) {
                        messageData.match = matchId;
                    } else if (teamId) {
                        const TeamChat = require('../models/TeamChat');
                        let teamChat = await TeamChat.findOne({ team: teamId });
                        if (!teamChat) {
                            const team = await Team.findById(teamId);
                            teamChat = new TeamChat({
                                team: teamId,
                                createdBy: team.createdBy,
                                isActive: true
                            });
                            await teamChat.save();
                        }
                        messageData.teamChat = teamChat._id;
                        messageData.isPrivate = false; // Team chats don't support private messages
                    }

                    if (isPrivate === 'true' && matchId) {
                        messageData.recipient = recipientId;
                    }

                    const message = new Message(messageData);
                    await message.save();
                    
                    // Populate sender info for response
                    await message.populate('sender', 'name');

                    console.log(`Image message uploaded successfully: ${result.public_id}`);
                    
                    // Emit the message via Socket.IO for real-time delivery
                    const io = req.app.get('socketio');
                    if (io) {
                        const messageToEmit = {
                            _id: message._id,
                            sender: { _id: message.sender._id, name: message.sender.name },
                            messageType: 'image',
                            attachment: message.attachment,
                            timestamp: message.createdAt,
                            isPrivate: message.isPrivate,
                            recipient: message.isPrivate ? { _id: message.recipient } : undefined,
                            createdAt: message.createdAt
                        };

                        if (matchId) {
                            messageToEmit.matchId = matchId;
                            if (message.isPrivate && recipientId) {
                                // Send to specific recipient for private messages
                                io.emit('privateImageMessage', messageToEmit);
                            } else {
                                // Broadcast to room for group messages
                                io.to(matchId).emit('receiveMessage', messageToEmit);
                            }
                            console.log(`Socket.IO: Cloudinary image message broadcast for match ${matchId}`);
                        } else if (teamId) {
                            messageToEmit.teamId = teamId;
                            // Broadcast to team room
                            const teamRoomId = `team_${teamId}`;
                            io.to(teamRoomId).emit('receiveTeamMessage', messageToEmit);
                            console.log(`Socket.IO: Cloudinary team image message broadcast for team ${teamId}`);
                        }
                    }
                    
                    res.status(201).json(message);

                } catch (dbError) {
                    console.error('Database save error:', dbError);
                    // Clean up uploaded image if database save fails
                    try {
                        await cloudinary.uploader.destroy(result.public_id);
                    } catch (cleanupError) {
                        console.error('Failed to cleanup uploaded image:', cleanupError);
                    }
                    res.status(500).json({ message: 'Error saving message to database' });
                }
            }
        );

        // Pipe the buffer from multer into the Cloudinary upload stream
        uploadStream.end(req.file.buffer);

    } catch (err) {
        console.error('Image upload route error:', err);
        next(err);
    }
});

// @desc    Send text/emoji message
// @route   POST /api/messages
// @access  Private
router.post('/', protect, async (req, res, next) => {
    try {
        const { matchId, text, messageType = 'text', isPrivate = false, recipientId } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!matchId) {
            return res.status(400).json({ message: 'Match ID is required' });
        }

        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Message text is required' });
        }

        if (isPrivate && !recipientId) {
            return res.status(400).json({ message: 'Recipient ID is required for private messages' });
        }

        // Authorization: Check if user is part of this match
        const userIsInMatch = await isUserInMatch(matchId, userId);
        if (!userIsInMatch) {
            return res.status(403).json({ message: 'Not authorized to send messages in this match.' });
        }

        // Create message
        const messageData = {
            match: matchId,
            sender: userId,
            text: text.trim(),
            messageType: messageType,
            isPrivate: isPrivate,
        };

        if (isPrivate) {
            messageData.recipient = recipientId;
        }

        const message = new Message(messageData);
        await message.save();
        
        // Populate sender info for response
        await message.populate('sender', 'name');

        console.log(`Message sent successfully: ${message._id}`);
        res.status(201).json(message);

    } catch (err) {
        console.error('Send message route error:', err);
        next(err);
    }
});

module.exports = router;
