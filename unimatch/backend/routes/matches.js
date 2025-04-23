const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const Team = require('../models/Team');
const { protect } = require('../middleware/authMiddleware');

// Helper function to check if user is a member of a team
const isTeamMember = (team, userId) => {
    return team.members.some(member => member.equals(userId));
};

// @desc    Send a match request from one team to another
// @route   POST /api/matches
// @access  Private
router.post('/', protect, async (req, res, next) => {
    const { requestingTeamId, receivingTeamId } = req.body;
    const userId = req.user.id;

    try {
        // Validate IDs
        if (!requestingTeamId || !receivingTeamId) {
            return res.status(400).json({ message: 'Requesting and receiving team IDs are required.' });
        }
        if (requestingTeamId === receivingTeamId) {
             return res.status(400).json({ message: 'A team cannot send a match request to itself.' });
        }

        // Find both teams
        const requestingTeam = await Team.findById(requestingTeamId);
        const receivingTeam = await Team.findById(receivingTeamId);

        if (!requestingTeam || !receivingTeam) {
            return res.status(404).json({ message: 'One or both teams not found.' });
        }

        // Authorization: Check if the user is a member of the requesting team
        if (!isTeamMember(requestingTeam, userId)) {
            return res.status(403).json({ message: 'You must be a member of the requesting team.' });
        }

        // Optional: Check if teams are from the same university (if required)
        // if (requestingTeam.university !== receivingTeam.university) {
        //     return res.status(400).json({ message: 'Teams must be from the same university to match.' });
        // }

        // Check for existing pending or accepted matches between these teams (either direction)
        const existingMatch = await Match.findOne({
            $or: [
                { requestingTeam: requestingTeamId, receivingTeam: receivingTeamId },
                { requestingTeam: receivingTeamId, receivingTeam: requestingTeamId }
            ],
            status: { $in: ['pending', 'accepted'] } // Check for pending or already accepted
        });

        if (existingMatch) {
             if (existingMatch.status === 'pending') {
                 return res.status(400).json({ message: 'A match request is already pending between these teams.' });
             } else { // status === 'accepted'
                 return res.status(400).json({ message: 'These teams are already matched.' });
             }
        }

        // Create new match request
        const newMatch = new Match({
            requestingTeam: requestingTeamId,
            receivingTeam: receivingTeamId,
            status: 'pending',
        });

        const savedMatch = await newMatch.save();
        // Populate teams for the response
        const populatedMatch = await Match.findById(savedMatch._id)
                                        .populate('requestingTeam', 'name university')
                                        .populate('receivingTeam', 'name university');

        res.status(201).json(populatedMatch);

    } catch (err) {
        next(err); // Pass errors to central handler
    }
});

// @desc    Get match requests for a specific team (incoming and outgoing)
// @route   GET /api/matches/team/:teamId
// @access  Private (Team members only)
router.get('/team/:teamId', protect, async (req, res, next) => {
    const teamId = req.params.teamId;
    const userId = req.user.id;

    try {
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: 'Team not found.' });
        }

        // Authorization: Check if user is a member of the team
        if (!isTeamMember(team, userId)) {
            return res.status(403).json({ message: 'You must be a member of this team to view its matches.' });
        }

        // Find incoming and outgoing requests for the team
        const matches = await Match.find({
            $or: [
                { requestingTeam: teamId },
                { receivingTeam: teamId }
            ]
        })
        // Populate team details including members
        .populate({
            path: 'requestingTeam',
            select: 'name university members', // Include members
            populate: { path: 'members', select: 'name email _id' } // Populate member details (optional, but useful)
        })
        .populate({
            path: 'receivingTeam',
            select: 'name university members', // Include members
            populate: { path: 'members', select: 'name email _id' } // Populate member details (optional, but useful)
        })
        .sort({ createdAt: -1 }); // Sort by most recent

        res.json(matches);

    } catch (err) {
        next(err);
    }
});


// @desc    Respond to a pending match request (accept or reject)
// @route   PUT /api/matches/:matchId/respond
// @access  Private (Members of the receiving team only)
router.put('/:matchId/respond', protect, async (req, res, next) => {
    const matchId = req.params.matchId;
    const { response } = req.body; // Expect 'accepted' or 'rejected'
    const userId = req.user.id;

    if (!['accepted', 'rejected'].includes(response)) {
        return res.status(400).json({ message: 'Invalid response. Must be "accepted" or "rejected".' });
    }

    try {
        const match = await Match.findById(matchId).populate('receivingTeam'); // Populate receiving team to check membership
        if (!match) {
            return res.status(404).json({ message: 'Match request not found.' });
        }

        if (match.status !== 'pending') {
            return res.status(400).json({ message: `Match request is already ${match.status}.` });
        }

        // Authorization: Check if user is a member of the receiving team
        if (!isTeamMember(match.receivingTeam, userId)) {
            return res.status(403).json({ message: 'Only members of the receiving team can respond.' });
        }

        // Update match status
        match.status = response;
        match.respondedAt = Date.now();

        // Optional: If accepted, update the status of both teams
        if (response === 'accepted') {
            await Team.updateMany(
                { _id: { $in: [match.requestingTeam, match.receivingTeam] } },
                { $set: { status: 'matched' } } // Update team status
            );
            // Optional: Create chat room ID here if implementing chat
        }

        const updatedMatch = await match.save();
        const populatedMatch = await Match.findById(updatedMatch._id)
                                        .populate('requestingTeam', 'name university')
                                        .populate('receivingTeam', 'name university');

        res.json(populatedMatch);

    } catch (err) {
        next(err);
    }
});

// @desc    Cancel a pending match request (by requesting team member)
// @route   DELETE /api/matches/:matchId/cancel
// @access  Private (Members of the requesting team only)
router.delete('/:matchId/cancel', protect, async (req, res, next) => {
    const matchId = req.params.matchId;
    const userId = req.user.id;

    try {
        const match = await Match.findById(matchId).populate('requestingTeam'); // Populate requesting team
        if (!match) {
            return res.status(404).json({ message: 'Match request not found.' });
        }

        if (match.status !== 'pending') {
            return res.status(400).json({ message: `Cannot cancel a match request that is already ${match.status}.` });
        }

        // Authorization: Check if user is a member of the requesting team
        if (!isTeamMember(match.requestingTeam, userId)) {
            return res.status(403).json({ message: 'Only members of the requesting team can cancel.' });
        }

        // Update status to 'cancelled' or delete the document
        // Option 1: Update status
        // match.status = 'cancelled';
        // await match.save();
        // res.json({ message: 'Match request cancelled.' });

        // Option 2: Delete the document entirely
        await Match.deleteOne({ _id: matchId });
        res.json({ message: 'Match request deleted.' });


    } catch (err) {
        next(err);
    }
});

// @desc    Close an accepted match (exit chat)
// @route   PUT /api/matches/:matchId/close
// @access  Private (Members of either matched team)
router.put('/:matchId/close', protect, async (req, res, next) => {
    const matchId = req.params.matchId;
    const userId = req.user.id;

    try {
        const match = await Match.findById(matchId)
                                 .populate('requestingTeam', 'members')
                                 .populate('receivingTeam', 'members');

        if (!match) {
            return res.status(404).json({ message: 'Match not found.' });
        }

        // Only allow closing 'accepted' matches
        if (match.status !== 'accepted') {
            return res.status(400).json({ message: `Cannot close a match that is currently ${match.status}.` });
        }

        // Authorization: Check if user is a member of either team
        const isMemberOfRequesting = isTeamMember(match.requestingTeam, userId);
        const isMemberOfReceiving = isTeamMember(match.receivingTeam, userId);

        if (!isMemberOfRequesting && !isMemberOfReceiving) {
            return res.status(403).json({ message: 'You must be a member of one of the matched teams to close the chat.' });
        }

        // Update status to 'closed'
        match.status = 'closed';
        match.closedAt = Date.now(); // Optional: track when it was closed
        // You might also want to set the team statuses back to 'available' or similar if needed
        // await Team.updateMany(
        //     { _id: { $in: [match.requestingTeam._id, match.receivingTeam._id] } },
        //     { $set: { status: 'available' } } // Example: Reset team status
        // );

        const updatedMatch = await match.save();
        const populatedMatch = await Match.findById(updatedMatch._id)
                                        .populate('requestingTeam', 'name university')
                                        .populate('receivingTeam', 'name university');

        res.json(populatedMatch);

    } catch (err) {
        next(err);
    }
});


module.exports = router;
