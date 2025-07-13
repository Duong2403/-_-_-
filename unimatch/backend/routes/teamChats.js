const express = require('express');
const router = express.Router();
const TeamChat = require('../models/TeamChat');
const Team = require('../models/Team');
const Message = require('../models/Message');
const { protect } = require('../middleware/authMiddleware');

// Helper function to check if user is a team member
const isTeamMember = (team, userId) => {
  return team.members && team.members.some(memberId => memberId.equals ? memberId.equals(userId) : memberId.toString() === userId.toString());
};

// Helper function to validate team membership for team chat access
const validateTeamChatAccess = async (teamId, userId) => {
  const team = await Team.findById(teamId).populate('members', '_id');
  if (!team) {
    throw new Error('Team not found');
  }
  
  if (!isTeamMember(team, userId)) {
    throw new Error('You must be a member of this team to access its chat');
  }
  
  return team;
};

// @desc    Get or create team chat for a specific team
// @route   GET /api/team-chats/:teamId
// @access  Private (Team members only)
router.get('/:teamId', protect, async (req, res, next) => {
  const teamId = req.params.teamId;
  const userId = req.user.id;

  try {
    // Validate team membership
    const team = await validateTeamChatAccess(teamId, userId);
    
    // Find existing team chat or create new one
    let teamChat = await TeamChat.findOne({ team: teamId });
    
    if (!teamChat) {
      // Create team chat if it doesn't exist
      teamChat = new TeamChat({
        team: teamId,
        createdBy: team.createdBy, // Use team creator as chat creator
        isActive: true
      });
      await teamChat.save();
      console.log(`Created new team chat for team ${teamId}`);
    }

    // Populate team information for response
    const populatedTeamChat = await TeamChat.findById(teamChat._id)
      .populate('team', 'name university members')
      .populate('createdBy', 'name');

    res.json(populatedTeamChat);

  } catch (err) {
    if (err.message === 'Team not found') {
      return res.status(404).json({ message: err.message });
    }
    if (err.message === 'You must be a member of this team to access its chat') {
      return res.status(403).json({ message: err.message });
    }
    next(err);
  }
});

// @desc    Get team chat messages
// @route   GET /api/team-chats/:teamId/messages
// @access  Private (Team members only)
router.get('/:teamId/messages', protect, async (req, res, next) => {
  const teamId = req.params.teamId;
  const userId = req.user.id;

  try {
    // Validate team membership
    await validateTeamChatAccess(teamId, userId);
    
    // Find team chat
    const teamChat = await TeamChat.findOne({ team: teamId });
    if (!teamChat) {
      return res.status(404).json({ message: 'Team chat not found' });
    }

    // Fetch messages for this team chat
    const messages = await Message.find({ 
      teamChat: teamChat._id,
      isPrivate: false // Team chats don't support private messages
    })
    .populate('sender', 'name')
    .sort({ createdAt: 1 }); // Sort ascending (oldest first)

    console.log(`Fetched ${messages.length} team chat messages for team ${teamId}`);
    res.json(messages);

  } catch (err) {
    if (err.message === 'Team not found') {
      return res.status(404).json({ message: err.message });
    }
    if (err.message === 'You must be a member of this team to access its chat') {
      return res.status(403).json({ message: err.message });
    }
    next(err);
  }
});

// @desc    Send a message to team chat
// @route   POST /api/team-chats/:teamId/messages
// @access  Private (Team members only)
router.post('/:teamId/messages', protect, async (req, res, next) => {
  const teamId = req.params.teamId;
  const userId = req.user.id;
  const { text, messageType = 'text' } = req.body;

  try {
    // Validate required fields
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    // Validate team membership
    await validateTeamChatAccess(teamId, userId);
    
    // Find or create team chat
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

    // Create message
    const messageData = {
      teamChat: teamChat._id,
      sender: userId,
      text: text.trim(),
      messageType: messageType,
      isPrivate: false // Team chat messages are always public within the team
    };

    const message = new Message(messageData);
    await message.save();
    
    // Populate sender info for response
    await message.populate('sender', 'name');

    console.log(`Team chat message sent successfully: ${message._id} for team ${teamId}`);
    res.status(201).json(message);

  } catch (err) {
    if (err.message === 'Team not found') {
      return res.status(404).json({ message: err.message });
    }
    if (err.message === 'You must be a member of this team to access its chat') {
      return res.status(403).json({ message: err.message });
    }
    console.error('Send team chat message error:', err);
    next(err);
  }
});

// @desc    Get team chat info/settings
// @route   GET /api/team-chats/:teamId/info
// @access  Private (Team members only)
router.get('/:teamId/info', protect, async (req, res, next) => {
  const teamId = req.params.teamId;
  const userId = req.user.id;

  try {
    // Validate team membership
    const team = await validateTeamChatAccess(teamId, userId);
    
    // Find team chat
    const teamChat = await TeamChat.findOne({ team: teamId })
      .populate('team', 'name university members')
      .populate('createdBy', 'name');

    if (!teamChat) {
      return res.status(404).json({ message: 'Team chat not found' });
    }

    // Get member count and basic stats
    const memberCount = team.members ? team.members.length : 0;
    const messageCount = await Message.countDocuments({ teamChat: teamChat._id });

    const chatInfo = {
      ...teamChat.toObject(),
      stats: {
        memberCount,
        messageCount
      }
    };

    res.json(chatInfo);

  } catch (err) {
    if (err.message === 'Team not found') {
      return res.status(404).json({ message: err.message });
    }
    if (err.message === 'You must be a member of this team to access its chat') {
      return res.status(403).json({ message: err.message });
    }
    next(err);
  }
});

module.exports = router; 