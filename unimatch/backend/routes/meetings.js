const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting');
const Match = require('../models/Match');
const Team = require('../models/Team');
const { protect } = require('../middleware/authMiddleware');

// Helper function to check if user is part of the match via team membership
const isUserInMatch = async (matchId, userId) => {
    const match = await Match.findById(matchId).populate('requestingTeam receivingTeam');
    if (!match || match.status !== 'accepted') return false; // Only allow for accepted matches
    const requestingTeam = match.requestingTeam;
    const receivingTeam = match.receivingTeam;
    // Check if user is in either team
    const isMember = (requestingTeam?.members.some(m => m.equals(userId))) ||
                     (receivingTeam?.members.some(m => m.equals(userId)));
    return isMember;
};

// @desc    Propose a new meeting for a match
// @route   POST /api/meetings
// @access  Private (Users part of the accepted match)
router.post('/', protect, async (req, res, next) => {
    console.log("Entering Propose Meeting Route"); // Add log at the start
    const { matchId, proposedSlots, location, description } = req.body;
    const proposerId = req.user.id;

    // Log the received data for debugging
    console.log("Propose Meeting Request Body:", req.body);

    // Basic validation
    if (!matchId || !proposedSlots || proposedSlots.length === 0 || !location) {
        return res.status(400).json({ message: 'Match ID, at least one proposed slot, and location are required.' });
    }
    // TODO: Add validation for date/time format in proposedSlots

    try {
        // Authorization: Check if user is part of the accepted match
        const userIsInAcceptedMatch = await isUserInMatch(matchId, proposerId);
        if (!userIsInAcceptedMatch) {
            return res.status(403).json({ message: 'You must be part of this accepted match to propose a meeting.' });
        }

        // Check for existing proposed/scheduled meeting for this match
        const existingMeeting = await Meeting.findOne({ match: matchId, status: { $in: ['proposed', 'scheduled'] } });
        if (existingMeeting) {
            return res.status(400).json({ message: `A meeting is already ${existingMeeting.status} for this match.` });
        }

        // Create new meeting proposal
        const newMeeting = new Meeting({
            match: matchId,
            proposer: proposerId,
            proposedSlots,
            location,
            description, // Optional
            status: 'proposed'
        });

        console.log("Attempting to save new meeting proposal..."); // Log before save
        const savedMeeting = await newMeeting.save();
        console.log("Meeting proposal saved successfully:", savedMeeting._id); // Log after save
        // Populate relevant fields for response
        const populatedMeeting = await Meeting.findById(savedMeeting._id)
            .populate('proposer', 'name')
            .populate('match', 'requestingTeam receivingTeam'); // Populate teams in match

        // Notify clients in the match room about the new proposal
        const io = req.app.get('socketio'); // Get io instance from app
        io.to(matchId).emit('meetingProposed', populatedMeeting); // Emit event with meeting data
        console.log(`Emitted 'meetingProposed' to room ${matchId}`);

        res.status(201).json(populatedMeeting);

    } catch (err) {
        console.error("Propose Meeting Route Error:", err);
        console.error("Propose Meeting Route - Caught Error Type:", err.name); // Log error type
        console.error("Propose Meeting Route - Caught Error Message:", err.message); // Log error message
        // Ensure the error is passed to the default error handler which should send a 500
        // If a specific validation error occurs, Mongoose might throw a ValidationError
        if (err.name === 'ValidationError') {
             // Send a 400 with specific validation messages
             return res.status(400).json({ message: "Validation failed", errors: err.errors });
        }
        // Pass other errors to the default handler
        next(err);
    }
});

// @desc    Get meeting proposals for a specific match
// @route   GET /api/meetings/match/:matchId
// @access  Private (Users part of the match)
router.get('/match/:matchId', protect, async (req, res, next) => {
    const matchId = req.params.matchId;
    const userId = req.user.id;

    try {
        // Authorization: Check if user is part of the match
        const userIsInAcceptedMatch = await isUserInMatch(matchId, userId);
         if (!userIsInAcceptedMatch) {
            return res.status(403).json({ message: 'Not authorized to view meetings for this match.' });
        }

        // Find meetings for this match (could be multiple if cancelled/completed ones exist)
        const meetings = await Meeting.find({ match: matchId })
            .populate('proposer', 'name')
            .sort({ createdAt: -1 }); // Show newest first

        res.json(meetings);

    } catch (err) {
        next(err);
    }
});

// TODO: Add routes for responding to proposals (accepting/rejecting slots),
// @desc    Respond to a meeting proposal (accept/reject a specific slot)
// @route   PUT /api/meetings/:meetingId/respond
// @access  Private (Users part of the match only)
router.put('/:meetingId/respond', protect, async (req, res, next) => {
    const meetingId = req.params.meetingId;
    // Expecting slotIndex (-1 means reject all) and status ('accepted'/'rejected')
    const { acceptedSlotIndex, status } = req.body;
    const userId = req.user.id;

    if (status !== 'accepted' && status !== 'rejected') {
        return res.status(400).json({ message: 'Invalid status. Must be "accepted" or "rejected".' });
    }
    if (status === 'accepted' && (typeof acceptedSlotIndex !== 'number' || acceptedSlotIndex < 0)) {
         return res.status(400).json({ message: 'Valid acceptedSlotIndex is required when accepting.' });
    }

    try {
        const meeting = await Meeting.findById(meetingId).populate('match');
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting proposal not found.' });
        }
        if (meeting.status !== 'proposed') {
             return res.status(400).json({ message: `Meeting is already ${meeting.status}.` });
        }

        // Authorization: Check if user is part of the match
        const userIsInAcceptedMatch = await isUserInMatch(meeting.match._id, userId);
        if (!userIsInAcceptedMatch) {
            return res.status(403).json({ message: 'Not authorized to respond to this meeting proposal.' });
        }

        // Validate slot index if accepting
        if (status === 'accepted' && acceptedSlotIndex >= meeting.proposedSlots.length) {
             return res.status(400).json({ message: 'Invalid slot index.' });
        }

        // Update or add user's response
        const existingResponseIndex = meeting.responses.findIndex(r => r.userId.equals(userId));
        const responseData = { userId, acceptedSlotIndex: status === 'accepted' ? acceptedSlotIndex : -1, status };

        if (existingResponseIndex > -1) {
            // User is changing their response
            meeting.responses[existingResponseIndex] = responseData;
        } else {
            // User is responding for the first time
            meeting.responses.push(responseData);
        }

        // --- Scheduling Logic (Example: Schedule if all members accept the SAME slot) ---
        // This needs refinement based on exact requirements (e.g., how many need to accept?)
        const match = await Match.findById(meeting.match._id).populate('requestingTeam receivingTeam');
        const allMemberIds = [
            ...(match.requestingTeam?.members || []),
            ...(match.receivingTeam?.members || [])
        ].map(id => id.toString()); // Get all unique member IDs as strings

        const acceptedResponses = meeting.responses.filter(r => r.status === 'accepted');
        let scheduled = false;

        if (status === 'accepted') {
             // Check if everyone has accepted the *same* slot index
             const acceptedSlotResponses = acceptedResponses.filter(r => r.acceptedSlotIndex === acceptedSlotIndex);
             const uniqueAccepters = new Set(acceptedSlotResponses.map(r => r.userId.toString()));

             // Check if the set of unique accepters for this slot matches all members in the match
             if (uniqueAccepters.size === allMemberIds.length && allMemberIds.every(id => uniqueAccepters.has(id))) {
                 meeting.status = 'scheduled';
                 meeting.scheduledSlot = meeting.proposedSlots[acceptedSlotIndex];
                 scheduled = true;
                 console.log(`Meeting ${meetingId} scheduled for slot index ${acceptedSlotIndex}`);
             }
        }
        // --- End Scheduling Logic ---

        const updatedMeeting = await meeting.save();

        // Notify clients via Socket.IO about the update
        const io = req.app.get('socketio');
        const eventData = await Meeting.findById(updatedMeeting._id).populate('proposer', 'name').populate('responses.userId', 'name'); // Repopulate for event
        io.to(meeting.match._id.toString()).emit('meetingUpdated', eventData);
        console.log(`Emitted 'meetingUpdated' to room ${meeting.match._id}`);


        res.json(eventData);

    } catch (err) {
        next(err);
    }
});

// @desc    Cancel a proposed or scheduled meeting
// @route   DELETE /api/meetings/:meetingId
// @access  Private (Members of either team in the match)
router.delete('/:meetingId', protect, async (req, res, next) => {
    const meetingId = req.params.meetingId;
    const userId = req.user.id;

    try {
        const meeting = await Meeting.findById(meetingId).populate('match');
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found.' });
        }

        // Allow cancellation only if proposed or scheduled
        if (meeting.status !== 'proposed' && meeting.status !== 'scheduled') {
             return res.status(400).json({ message: `Cannot cancel a meeting with status ${meeting.status}.` });
        }

        // Authorization: Check if user is part of the match
        const userIsInAcceptedMatch = await isUserInMatch(meeting.match._id, userId);
        if (!userIsInAcceptedMatch) {
            return res.status(403).json({ message: 'Not authorized to cancel this meeting.' });
        }

        // Update status to 'cancelled'
        meeting.status = 'cancelled';
        // Optionally clear scheduled slot if cancelling a scheduled meeting
        if (meeting.scheduledSlot) {
            meeting.scheduledSlot = undefined;
        }
        const updatedMeeting = await meeting.save();

        // Notify clients via Socket.IO about the cancellation
        const io = req.app.get('socketio');
        const eventData = await Meeting.findById(updatedMeeting._id).populate('proposer', 'name'); // Repopulate needed fields
        io.to(meeting.match._id.toString()).emit('meetingUpdated', eventData); // Use meetingUpdated event
        console.log(`Emitted 'meetingUpdated' (cancelled) to room ${meeting.match._id}`);

        res.json({ message: 'Meeting cancelled successfully.', meeting: eventData });

    } catch (err) {
        next(err);
    }
});


// TODO: Add route for marking meeting as complete
// TODO: Add route for submitting reviews

module.exports = router;
