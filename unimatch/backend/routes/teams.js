const express = require('express');
const router = express.Router();
const Team = require('../models/Team'); // Adjust path as necessary
const User = require('../models/User'); // Adjust path as necessary
const { protect } = require('../middleware/authMiddleware'); // Import protect middleware

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private
router.post('/', protect, async (req, res, next) => { // Added next
  // Add new fields to destructuring
  const { name, description, purpose, interests, meetingPreference, initialMemberEmails } = req.body; // Added initialMemberEmails
  const userId = req.user.id; // User creating the team

  try {
    const creator = await User.findById(userId);
    if (!creator) {
      return res.status(404).json({ message: 'Creator not found' });
    }

    // Create the team with only the creator initially
    const newTeam = new Team({
      name,
      description,
      purpose,
      interests,
      meetingPreference,
      university: creator.university,
      members: [userId], // Only creator initially
      createdBy: userId,
    });

    const savedTeam = await newTeam.save(); // Renamed variable

    // Populate members before sending back
    const populatedTeam = await Team.findById(savedTeam._id)
                                    .populate('members', 'name email university')
                                    .populate('createdBy', 'name email');

    res.status(201).json(populatedTeam); // Send back populated team

  } catch (err) {
    console.error('Create Team Error:', err.message); // Keep logging the error
    // Pass error to middleware (Validation errors will be handled by errorHandler)
    next(err);
  }
});

// @desc    Get teams for the logged-in user (teams they are a member of)
// @route   GET /api/teams
// @access  Private
router.get('/', protect, async (req, res, next) => { // Added next
    try {
        const teams = await Team.find({ members: req.user.id }).populate('members', 'name email university').populate('createdBy', 'name email');
        res.json(teams);
    } catch (err) {
        next(err); // Pass error to middleware
    }
});

// @desc    Get a specific team by ID
// @route   GET /api/teams/:id
// @access  Private (User must be a member to view?) - Let's allow any logged-in user for now
router.get('/:id', protect, async (req, res, next) => { // Added next
    try {
        const team = await Team.findById(req.params.id).populate('members', 'name email university').populate('createdBy', 'name email');
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Optional: Add check if user must be a member to view
        // if (!team.members.some(member => member.equals(req.user.id))) {
        //     return res.status(403).json({ message: 'Not authorized to view this team' });
        // }

        res.json(team);
    } catch (err) {
        console.error('Get Team By ID Error:', err.message);
        if (err.kind === 'ObjectId') {
             return res.status(404).json({ message: 'Team not found' });
        }
        next(err); // Pass error to middleware
    }
});


// @desc    Add a member to a team
// @route   PUT /api/teams/:id/invite
// @access  Private (Only team creator) - Changed from adding member to inviting
router.put('/:id/invite', protect, async (req, res, next) => {
    const { inviteeId } = req.body; // ID of the user to invite
    const teamId = req.params.id;
    const inviterId = req.user.id;
    const Invitation = require('../models/Invitation'); // Need Invitation model

    try {
        const team = await Team.findById(teamId);
        const invitee = await User.findById(inviteeId);

        // Validations
        if (!team) return res.status(404).json({ message: 'Team not found.' });
        if (!invitee) return res.status(404).json({ message: 'User to invite not found.' });

        // Authorization: Check if inviter is the creator
        if (!team.createdBy.equals(inviterId)) {
             return res.status(403).json({ message: 'Only the team creator can send invitations.' });
        }

        // Check if invitee is already a member
        if (team.members.some(member => member.equals(inviteeId))) {
            return res.status(400).json({ message: 'User is already a member of this team.' });
        }

        // Check if invitee is from the same university
        if (invitee.university !== team.university) {
             return res.status(400).json({ message: `Invited user must be from the same university (${team.university}).` });
        }

        // Check for existing pending invitation
        const existingInvite = await Invitation.findOne({ team: teamId, invitee: inviteeId, status: 'pending' });
        if (existingInvite) {
            return res.status(400).json({ message: 'An invitation is already pending for this user.' });
        }

        // Create and save invitation
        const invitation = new Invitation({
            team: teamId,
            inviter: inviterId,
            invitee: inviteeId,
            status: 'pending'
        });
        await invitation.save();

        // Populate for response
        const populatedInvite = await Invitation.findById(invitation._id)
            .populate('team', 'name')
            .populate('inviter', 'name')
            .populate('invitee', 'name');

        res.status(201).json({ message: 'Invitation sent successfully.', invitation: populatedInvite });

    } catch (err) {
        next(err);
    }
});


// @desc    Update team details (name, description, etc.)
// @route   PUT /api/teams/:id
// @access  Private (Only team creator)
router.put('/:id', protect, async (req, res, next) => { // Added next
    // Add new fields to destructuring
    const { name, description, purpose, interests, meetingPreference } = req.body;
    const teamId = req.params.id;
    const requesterId = req.user.id;

    try {
        let team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Authorization: Check if the requester is the creator
        if (!team.createdBy.equals(requesterId)) {
            return res.status(403).json({ message: 'Not authorized to update this team' });
        }

        // Update fields if provided
        if (name) team.name = name;
        if (description) team.description = description;
        if (purpose) team.purpose = purpose; // Update new field
        if (interests) team.interests = interests; // Update new field (expects array)
        if (meetingPreference) team.meetingPreference = meetingPreference; // Update new field
        // Potentially add status updates here too if needed

        const updatedTeam = await team.save();
        const populatedTeam = await Team.findById(updatedTeam._id).populate('members', 'name email university').populate('createdBy', 'name email');
        res.json(populatedTeam);

    } catch (err) {
        console.error('Update Team Details Error:', err.message);
        if (err.kind === 'ObjectId') {
             return res.status(404).json({ message: 'Team not found' });
        }
        // Handle potential validation errors from Mongoose
        // Pass error to middleware (Validation errors will be handled by errorHandler)
        next(err);
    }
});

// @desc    Remove a member from a team
// @route   DELETE /api/teams/:id/members/:memberId
// @access  Private (Team creator or the member themselves)
router.delete('/:id/members/:memberId', protect, async (req, res, next) => { // Added next
    const teamId = req.params.id;
    const memberIdToRemove = req.params.memberId;
    const requesterId = req.user.id;

    try {
        let team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Authorization: Allow creator or the member being removed
        const isCreator = team.createdBy.equals(requesterId);
        const isSelf = memberIdToRemove === requesterId.toString();

        if (!isCreator && !isSelf) {
             return res.status(403).json({ message: 'Not authorized to remove this member' });
        }

        // Prevent removing the last member (creator must delete the team instead)
        if (team.members.length <= 1 && isCreator && isSelf) {
             return res.status(400).json({ message: 'Cannot remove the last member. Delete the team instead.' });
        }
         // Prevent creator from removing themselves if they are the last member
        if (team.members.length <= 1 && isCreator) {
             return res.status(400).json({ message: 'Creator cannot remove themselves as the last member. Delete the team instead.' });
        }


        // Find the index of the member to remove
        const removeIndex = team.members.map(member => member.toString()).indexOf(memberIdToRemove);

        if (removeIndex === -1) {
            return res.status(404).json({ message: 'Member not found in this team' });
        }

        // Remove member
        team.members.splice(removeIndex, 1);
        await team.save();

        const updatedTeam = await Team.findById(teamId).populate('members', 'name email university').populate('createdBy', 'name email');
        res.json(updatedTeam);

    } catch (err) {
        console.error('Remove Team Member Error:', err.message);
        if (err.kind === 'ObjectId') {
             return res.status(404).json({ message: 'Team or Member not found' });
        }
        next(err); // Pass error to middleware
    }
});


// @desc    Delete a team
// @route   DELETE /api/teams/:id
// @access  Private (Only team creator)
router.delete('/:id', protect, async (req, res, next) => { // Added next
    const teamId = req.params.id;
    const requesterId = req.user.id;

    try {
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Authorization: Check if the requester is the creator
        if (!team.createdBy.equals(requesterId)) {
            return res.status(403).json({ message: 'Not authorized to delete this team' });
        }

        // Mongoose 6+ uses deleteOne() or deleteMany() on the model
        await Team.deleteOne({ _id: teamId });

        res.json({ message: 'Team removed successfully' });

    } catch (err) {
        console.error('Delete Team Error:', err.message);
         if (err.kind === 'ObjectId') {
             return res.status(404).json({ message: 'Team not found' });
        }
        next(err); // Pass error to middleware
    }
});

// @desc    Leave a team
// @route   DELETE /api/teams/:id/leave
// @access  Private (Team members only, except creator if last member)
router.delete('/:id/leave', protect, async (req, res, next) => {
    const teamId = req.params.id;
    const userId = req.user.id; // User requesting to leave

    try {
        let team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Check if user is actually a member
        const memberIndex = team.members.map(member => member.toString()).indexOf(userId.toString());
        if (memberIndex === -1) {
             return res.status(400).json({ message: 'You are not a member of this team.' });
        }

        // Prevent creator from leaving if they are the last member (they should delete the team)
        if (team.createdBy.equals(userId) && team.members.length === 1) {
            return res.status(400).json({ message: 'Creator cannot leave the team as the last member. Please delete the team instead.' });
        }

        // Remove user from members array
        team.members.splice(memberIndex, 1);

        // Optional: If the leaving user was the creator, assign a new creator?
        // Or maybe prevent creator from leaving unless team is empty? (Current logic prevents leaving if last member)
        // For simplicity, we'll just remove them for now.

        await team.save();

        // Check if team is now empty, if so, delete it? Or leave it empty?
        if (team.members.length === 0) {
            await Team.deleteOne({ _id: teamId });
             console.log(`Team ${teamId} deleted as it became empty after member left.`);
             return res.json({ message: 'Successfully left team. Team was deleted as it became empty.' });
        } else {
            const updatedTeam = await Team.findById(teamId).populate('members', 'name email university').populate('createdBy', 'name email');
            res.json({ message: 'Successfully left team.', team: updatedTeam });
        }

    } catch (err) {
        console.error('Leave Team Error:', err.message);
        if (err.kind === 'ObjectId') {
             return res.status(404).json({ message: 'Team not found' });
        }
        next(err); // Pass error to middleware
    }
});


// @desc    Find potential teams to match with for a given team
// @route   GET /api/teams/:teamId/potential-matches
// @access  Private (Team members only)
router.get('/:teamId/potential-matches', protect, async (req, res, next) => {
    const teamId = req.params.teamId;
    const userId = req.user.id;
    const Match = require('../models/Match'); // Need Match model here

    try {
        // 1. Find the user's team to get its university and ensure user is a member
        const userTeam = await Team.findById(teamId);
        if (!userTeam) {
            return res.status(404).json({ message: 'Your team not found.' });
        }
        if (!userTeam.members.some(member => member.equals(userId))) {
            return res.status(403).json({ message: 'You must be a member of this team.' });
        }

        // 2. Find teams the user's team already has pending/accepted matches with (in either direction)
        const existingMatches = await Match.find({
            $or: [
                { requestingTeam: teamId },
                { receivingTeam: teamId }
            ],
            status: { $in: ['pending', 'accepted'] }
        }).select('requestingTeam receivingTeam'); // Select only the team IDs

        const excludedTeamIds = new Set([teamId]); // Exclude user's own team
        existingMatches.forEach(match => {
            excludedTeamIds.add(match.requestingTeam.toString());
            excludedTeamIds.add(match.receivingTeam.toString());
        });

        // 3. Find potential teams:
        //    - Same university
        //    - Not the user's own team
        //    - Not already matched or having a pending request
        //    - Optional: Status 'active' or 'forming' (not 'matched' or 'inactive')
        const potentialTeams = await Team.find({
            _id: { $nin: Array.from(excludedTeamIds) }, // Exclude own team and teams with existing matches
            university: userTeam.university, // Must be same university
            status: { $in: ['forming', 'active'] } // Optional: Only find teams looking for matches
        })
        .select('name description members university status') // Select fields to return
        .populate('members', 'name'); // Populate member names for display

        res.json(potentialTeams);

    } catch (err) {
        next(err);
    }
});


module.exports = router;
