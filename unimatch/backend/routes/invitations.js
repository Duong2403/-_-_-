const express = require('express');
const router = express.Router();
const Invitation = require('../models/Invitation');
const Team = require('../models/Team');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Helper function to check if user is a member of a team
const isTeamMember = (team, userId) => {
    return team.members.some(member => member.equals(userId));
};

// @desc    Send an invitation to join a team
// @route   POST /api/invitations
// @access  Private (Team creator/members?) - Let's allow creator for now
router.post('/', protect, async (req, res, next) => {
    const { teamId, inviteeId } = req.body; // Expect team ID and the ID of the user to invite
    const inviterId = req.user.id;

    try {
        const team = await Team.findById(teamId);
        const invitee = await User.findById(inviteeId);
        const inviter = await User.findById(inviterId); // Fetch inviter to check university

        // Validations
        if (!team) return res.status(404).json({ message: 'Team not found.' });
        if (!invitee) return res.status(404).json({ message: 'User to invite not found.' });
        if (!inviter) return res.status(404).json({ message: 'Inviter not found.' }); // Should not happen

        // Authorization: Check if inviter is the creator (or member?)
        if (!team.createdBy.equals(inviterId)) {
             return res.status(403).json({ message: 'Only the team creator can send invitations.' });
        }

        // Check if invitee is already a member
        if (isTeamMember(team, inviteeId)) {
            return res.status(400).json({ message: 'User is already a member of this team.' });
        }

        // Check if invitee is from the same university
        if (invitee.university !== team.university) {
             return res.status(400).json({ message: `Invited user must be from the same university (${team.university}).` });
        }

        // Check for existing pending invitation
        const existingInvite = await Invitation.findOne({ team: teamId, invitee: inviteeId, status: 'pending' });
        if (existingInvite) {
            return res.status(400).json({ message: 'An invitation is already pending for this user to join this team.' });
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

        res.status(201).json(populatedInvite);

    } catch (err) {
        next(err);
    }
});

// @desc    Get pending invitations for the logged-in user
// @route   GET /api/invitations/pending
// @access  Private
router.get('/pending', protect, async (req, res, next) => {
    try {
        const pendingInvites = await Invitation.find({ invitee: req.user.id, status: 'pending' })
            .populate('team', 'name university')
            .populate('inviter', 'name');

        res.json(pendingInvites);
    } catch (err) {
        next(err);
    }
});

// @desc    Respond to a pending invitation (accept/reject)
// @route   PUT /api/invitations/:inviteId/respond
// @access  Private (Invitee only)
router.put('/:inviteId/respond', protect, async (req, res, next) => {
    const inviteId = req.params.inviteId;
    const { response } = req.body; // 'accepted' or 'rejected'
    const userId = req.user.id;

    if (!['accepted', 'rejected'].includes(response)) {
        return res.status(400).json({ message: 'Invalid response. Must be "accepted" or "rejected".' });
    }

    try {
        const invitation = await Invitation.findById(inviteId);
        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found.' });
        }

        // Authorization: Check if the logged-in user is the invitee
        if (!invitation.invitee.equals(userId)) {
            return res.status(403).json({ message: 'You are not authorized to respond to this invitation.' });
        }

        if (invitation.status !== 'pending') {
            return res.status(400).json({ message: `Invitation has already been ${invitation.status}.` });
        }

        // Update invitation status
        invitation.status = response;
        await invitation.save();

        // If accepted, add user to the team members list
        if (response === 'accepted') {
            const team = await Team.findById(invitation.team);
            if (team && !isTeamMember(team, userId)) { // Double check they aren't already a member
                team.members.push(userId);
                await team.save();
                 console.log(`User ${userId} accepted invite and added to team ${team._id}`);
            } else if (!team) {
                 console.error(`Team ${invitation.team} not found when trying to add accepted user ${userId}`);
                 // Should we revert invitation status? Or just log error?
            }
        }

        res.json(invitation); // Return updated invitation

    } catch (err) {
        next(err);
    }
});

// @desc    Cancel a pending invitation (sent by the logged-in user)
// @route   DELETE /api/invitations/:inviteId/cancel
// @access  Private (Inviter only)
router.delete('/:inviteId/cancel', protect, async (req, res, next) => {
    const inviteId = req.params.inviteId;
    const userId = req.user.id;

    try {
        const invitation = await Invitation.findById(inviteId);
        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found.' });
        }

        // Authorization: Check if the logged-in user is the inviter
        if (!invitation.inviter.equals(userId)) {
            return res.status(403).json({ message: 'You did not send this invitation.' });
        }

        if (invitation.status !== 'pending') {
            return res.status(400).json({ message: `Cannot cancel an invitation that is already ${invitation.status}.` });
        }

        // Option 1: Update status to 'cancelled'
        // invitation.status = 'cancelled';
        // await invitation.save();
        // res.json({ message: 'Invitation cancelled.' });

        // Option 2: Delete the invitation document
        await Invitation.deleteOne({ _id: inviteId });
        res.json({ message: 'Invitation deleted.' });

    } catch (err) {
        next(err);
    }
});


module.exports = router;
