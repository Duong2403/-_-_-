const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Match = require('../models/Match');
const Team = require('../models/Team');
const { protect } = require('../middleware/authMiddleware');

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

module.exports = router;
