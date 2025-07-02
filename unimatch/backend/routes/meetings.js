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
    console.log("=== Entering Propose Meeting Route ===");
    const { matchId, proposedSlots, location, description } = req.body;
    const proposerId = req.user.id;

    // Log the received data for debugging
    console.log("Propose Meeting Request Body:", JSON.stringify(req.body, null, 2));
    console.log("Proposer ID:", proposerId);

    // Basic validation
    if (!matchId || !proposedSlots || proposedSlots.length === 0 || !location) {
        console.log("Validation failed: Missing required fields");
        return res.status(400).json({ message: 'Match ID, at least one proposed slot, and location are required.' });
    }

    // Validate proposedSlots format
    for (let i = 0; i < proposedSlots.length; i++) {
        const slot = proposedSlots[i];
        if (!slot.startTime || !slot.endTime) {
            console.log(`Invalid slot ${i}:`, slot);
            return res.status(400).json({ message: `Slot ${i} is missing startTime or endTime.` });
        }
        const startTime = new Date(slot.startTime);
        const endTime = new Date(slot.endTime);
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            console.log(`Invalid date format in slot ${i}:`, slot);
            return res.status(400).json({ message: `Slot ${i} has invalid date format.` });
        }
        if (startTime >= endTime) {
            console.log(`Invalid time range in slot ${i}:`, slot);
            return res.status(400).json({ message: `Slot ${i}: start time must be before end time.` });
        }
    }

    try {
        // Authorization: Check if user is part of the accepted match
        console.log("Checking user authorization for match:", matchId);
        const userIsInAcceptedMatch = await isUserInMatch(matchId, proposerId);
        if (!userIsInAcceptedMatch) {
            console.log("Authorization failed: User not in accepted match");
            return res.status(403).json({ message: 'You must be part of this accepted match to propose a meeting.' });
        }
        console.log("User authorization passed");

        // Check for existing proposed/scheduled meeting for this match
        console.log("Checking for existing meetings...");
        const existingMeeting = await Meeting.findOne({ match: matchId, status: { $in: ['proposed', 'scheduled'] } });
        if (existingMeeting) {
            console.log("Found existing meeting:", existingMeeting._id, "with status:", existingMeeting.status);
            return res.status(400).json({ message: `A meeting is already ${existingMeeting.status} for this match.` });
        }
        console.log("No existing meetings found");

        // Create new meeting proposal
        const newMeeting = new Meeting({
            match: matchId,
            proposer: proposerId,
            proposedSlots,
            location,
            description, // Optional
            status: 'proposed'
        });

        console.log("Attempting to save new meeting proposal...");
        console.log("Meeting object:", JSON.stringify(newMeeting.toObject(), null, 2));
        
        const savedMeeting = await newMeeting.save();
        console.log("Meeting proposal saved successfully:", savedMeeting._id);
        
        // Populate relevant fields for response
        const populatedMeeting = await Meeting.findById(savedMeeting._id)
            .populate('proposer', 'name')
            .populate('match', 'requestingTeam receivingTeam'); // Populate teams in match

        console.log("Populated meeting:", JSON.stringify(populatedMeeting, null, 2));

        // Notify clients in the match room about the new proposal
        const io = req.app.get('socketio'); // Get io instance from app
        if (io) {
            io.to(matchId).emit('meetingProposed', populatedMeeting); // Emit event with meeting data
            console.log(`Emitted 'meetingProposed' to room ${matchId}`);
        } else {
            console.error("Socket.IO instance not found on app");
        }

        res.status(201).json(populatedMeeting);

    } catch (err) {
        console.error("=== Propose Meeting Route Error ===");
        console.error("Error Type:", err.name);
        console.error("Error Message:", err.message);
        console.error("Full Error:", err);
        
        // Ensure the error is passed to the default error handler which should send a 500
        // If a specific validation error occurs, Mongoose might throw a ValidationError
        if (err.name === 'ValidationError') {
             console.log("Mongoose validation error:", err.errors);
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

// @desc    Respond to a meeting proposal (accept/reject a specific slot)
// @route   PUT /api/meetings/:meetingId/respond
// @access  Private (Users part of the match only)
router.put('/:meetingId/respond', protect, async (req, res, next) => {
    console.log("=== Meeting Response Route ===");
    const meetingId = req.params.meetingId;
    // Expecting slotIndex (-1 means reject all) and status ('accepted'/'rejected')
    const { acceptedSlotIndex, status } = req.body;
    const userId = req.user.id;

    console.log("Meeting Response Request:");
    console.log("- Meeting ID:", meetingId);
    console.log("- Request Body:", JSON.stringify(req.body, null, 2));
    console.log("- User ID:", userId);
    console.log("- Accepted Slot Index:", acceptedSlotIndex, "Type:", typeof acceptedSlotIndex);
    console.log("- Status:", status);

    if (status !== 'accepted' && status !== 'rejected') {
        console.log("Validation failed: Invalid status");
        return res.status(400).json({ message: 'Invalid status. Must be "accepted" or "rejected".' });
    }
    if (status === 'accepted' && (typeof acceptedSlotIndex !== 'number' || acceptedSlotIndex < 0)) {
        console.log("Validation failed: Invalid acceptedSlotIndex for accepted status");
        console.log("- acceptedSlotIndex:", acceptedSlotIndex, "Type:", typeof acceptedSlotIndex);
        return res.status(400).json({ message: 'Valid acceptedSlotIndex is required when accepting.' });
    }

    try {
        console.log("Finding meeting by ID:", meetingId);
        const meeting = await Meeting.findById(meetingId).populate('match');
        if (!meeting) {
            console.log("Meeting not found");
            return res.status(404).json({ message: 'Meeting proposal not found.' });
        }
        console.log("Meeting found:", meeting._id, "Status:", meeting.status);
        
        if (meeting.status !== 'proposed') {
            console.log("Meeting status validation failed:", meeting.status);
            return res.status(400).json({ message: `Meeting is already ${meeting.status}.` });
        }

        // Authorization: Check if user is part of the match
        console.log("Checking user authorization for match:", meeting.match._id);
        const userIsInAcceptedMatch = await isUserInMatch(meeting.match._id, userId);
        if (!userIsInAcceptedMatch) {
            console.log("Authorization failed: User not in match");
            return res.status(403).json({ message: 'Not authorized to respond to this meeting proposal.' });
        }
        console.log("User authorization passed");

        // Validate slot index if accepting
        if (status === 'accepted' && acceptedSlotIndex >= meeting.proposedSlots.length) {
            console.log("Invalid slot index:", acceptedSlotIndex, "Max slots:", meeting.proposedSlots.length);
            return res.status(400).json({ message: 'Invalid slot index.' });
        }

        console.log("Current meeting responses:", meeting.responses);

        // Update or add user's response
        const existingResponseIndex = meeting.responses.findIndex(r => r.userId.equals(userId));
        const responseData = { userId, acceptedSlotIndex: status === 'accepted' ? acceptedSlotIndex : -1, status };

        console.log("Response data to save:", responseData);
        console.log("Existing response index:", existingResponseIndex);

        if (existingResponseIndex > -1) {
            // User is changing their response
            console.log("Updating existing response");
            meeting.responses[existingResponseIndex] = responseData;
        } else {
            // User is responding for the first time
            console.log("Adding new response");
            meeting.responses.push(responseData);
        }

        // --- Scheduling Logic (Example: Schedule if all members accept the SAME slot) ---
        // This needs refinement based on exact requirements (e.g., how many need to accept?)
        const match = await Match.findById(meeting.match._id).populate('requestingTeam receivingTeam');
        const allMemberIds = [
            ...(match.requestingTeam?.members || []),
            ...(match.receivingTeam?.members || [])
        ].map(id => id.toString()); // Get all unique member IDs as strings

        console.log("All member IDs in match:", allMemberIds);

        const acceptedResponses = meeting.responses.filter(r => r.status === 'accepted');
        let scheduled = false;

        if (status === 'accepted') {
             // Check if everyone has accepted the *same* slot index
             const acceptedSlotResponses = acceptedResponses.filter(r => r.acceptedSlotIndex === acceptedSlotIndex);
             const uniqueAccepters = new Set(acceptedSlotResponses.map(r => r.userId.toString()));

             console.log("Scheduling check:");
             console.log("- Accepted slot responses for slot", acceptedSlotIndex, ":", acceptedSlotResponses);
             console.log("- Unique accepters:", Array.from(uniqueAccepters));
             console.log("- Required members:", allMemberIds);

             // Check if the set of unique accepters for this slot matches all members in the match
             if (uniqueAccepters.size === allMemberIds.length && allMemberIds.every(id => uniqueAccepters.has(id))) {
                 meeting.status = 'scheduled';
                 meeting.scheduledSlot = meeting.proposedSlots[acceptedSlotIndex];
                 scheduled = true;
                 console.log(`Meeting ${meetingId} scheduled for slot index ${acceptedSlotIndex}`);
             } else {
                 console.log("Not all members have accepted the same slot yet");
             }
        }
        // --- End Scheduling Logic ---

        console.log("Saving updated meeting...");
        const updatedMeeting = await meeting.save();
        console.log("Meeting saved successfully");

        // Notify clients via Socket.IO about the update
        const io = req.app.get('socketio');
        const eventData = await Meeting.findById(updatedMeeting._id).populate('proposer', 'name').populate('responses.userId', 'name'); // Repopulate for event
        if (io) {
            io.to(meeting.match._id.toString()).emit('meetingUpdated', eventData);
            console.log(`Emitted 'meetingUpdated' to room ${meeting.match._id}`);
        } else {
            console.error("Socket.IO instance not found");
        }

        console.log("Sending response:", JSON.stringify(eventData, null, 2));
        res.json(eventData);

    } catch (err) {
        console.error("=== Meeting Response Route Error ===");
        console.error("Error Type:", err.name);
        console.error("Error Message:", err.message);
        console.error("Full Error:", err);
        next(err);
    }
});

// @desc    Cancel a proposed or scheduled meeting
// @route   DELETE /api/meetings/:meetingId
// @access  Private (Members of either team in the match)
router.delete('/:meetingId', protect, async (req, res, next) => {
    console.log("=== Meeting Cancellation Route ===");
    const meetingId = req.params.meetingId;
    const userId = req.user.id;

    console.log("Meeting Cancellation Request:");
    console.log("- Meeting ID:", meetingId);
    console.log("- User ID:", userId);

    try {
        console.log("Finding meeting by ID:", meetingId);
        const meeting = await Meeting.findById(meetingId).populate('match');
        if (!meeting) {
            console.log("Meeting not found");
            return res.status(404).json({ message: 'Meeting not found.' });
        }

        console.log("Meeting found:", meeting._id, "Status:", meeting.status);

        // Allow cancellation only if proposed or scheduled
        if (meeting.status !== 'proposed' && meeting.status !== 'scheduled') {
            console.log("Cannot cancel meeting with status:", meeting.status);
            return res.status(400).json({ message: `Cannot cancel a meeting with status ${meeting.status}.` });
        }

        // Authorization: Check if user is part of the match
        console.log("Checking user authorization for match:", meeting.match._id);
        const userIsInAcceptedMatch = await isUserInMatch(meeting.match._id, userId);
        if (!userIsInAcceptedMatch) {
            console.log("Authorization failed: User not in match");
            return res.status(403).json({ message: 'Not authorized to cancel this meeting.' });
        }
        console.log("User authorization passed");

        // Update status to 'cancelled'
        console.log("Updating meeting status to cancelled");
        meeting.status = 'cancelled';
        // Optionally clear scheduled slot if cancelling a scheduled meeting
        if (meeting.scheduledSlot) {
            console.log("Clearing scheduled slot");
            meeting.scheduledSlot = undefined;
        }
        
        console.log("Saving cancelled meeting...");
        const updatedMeeting = await meeting.save();
        console.log("Meeting cancelled successfully");

        // Notify clients via Socket.IO about the cancellation
        const io = req.app.get('socketio');
        const eventData = await Meeting.findById(updatedMeeting._id).populate('proposer', 'name'); // Repopulate needed fields
        if (io) {
            io.to(meeting.match._id.toString()).emit('meetingUpdated', eventData); // Use meetingUpdated event
            console.log(`Emitted 'meetingUpdated' (cancelled) to room ${meeting.match._id}`);
        } else {
            console.error("Socket.IO instance not found");
        }

        console.log("Sending cancellation response");
        res.json({ message: 'Meeting cancelled successfully.', meeting: eventData });

    } catch (err) {
        console.error("=== Meeting Cancellation Route Error ===");
        console.error("Error Type:", err.name);
        console.error("Error Message:", err.message);
        console.error("Full Error:", err);
        next(err);
    }
});


// TODO: Add route for marking meeting as complete
// TODO: Add route for submitting reviews

module.exports = router;
