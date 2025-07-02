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


module.exports = router;
