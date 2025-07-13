const express = require('express');
const router = express.Router();
const Invitation = require('../models/Invitation');
const Team = require('../models/Team');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { sendInvitationEmail } = require('../config/emailConfig');
const { handleMemberJoinedTeam } = require('../utils/teamChatManager');

// Helper function to check if user is a member of a team
const isTeamMember = (team, userId) => {
    return team.members.some(member =>
        (member && typeof member.equals === 'function')
            ? member.equals(userId)
            : member && member.toString() === userId.toString()
    );
};

// @desc    Send an invitation to join a team
// @route   POST /api/invitations
// @access  Private (Team creator/members?) - Let's allow creator for now
router.post('/', protect, async (req, res, next) => {
    const { teamId, inviteeId } = req.body; // Expect team ID and the ID of the user to invite
    const inviterId = req.user.id;

    console.log(`=== TEAM INVITATION DEBUG ===`);
    console.log(`Inviter: ${req.user.name} (${inviterId})`);
    console.log(`Team ID: ${teamId}`);
    console.log(`Invitee ID: ${inviteeId}`);

    try {
        const team = await Team.findById(teamId);
        const invitee = await User.findById(inviteeId);
        const inviter = await User.findById(inviterId); // Fetch inviter to check university

        // Validations
        if (!team) {
            console.log(`❌ Team ${teamId} not found`);
            return res.status(404).json({ message: 'Team not found.' });
        }
        if (!invitee) {
            console.log(`❌ Invitee ${inviteeId} not found`);
            return res.status(404).json({ message: 'User to invite not found.' });
        }
        if (!inviter) {
            console.log(`❌ Inviter ${inviterId} not found`);
            return res.status(404).json({ message: 'Inviter not found.' });
        }

        console.log(`Team: "${team.name}" (${team.university})`);
        console.log(`Invitee: ${invitee.name} (${invitee.email}) - ${invitee.university}`);

        // Authorization: Check if inviter is the creator (or member?)
        if (!isTeamMember(team, inviterId)) {
            console.log(`❌ Authorization failed: ${inviterId} is not a member of team ${teamId}`);
             return res.status(403).json({ message: 'Only team members can send invitations.' });
        }

        // Check if invitee is already a member
        if (isTeamMember(team, inviteeId)) {
            console.log(`❌ Invitee ${inviteeId} is already a member of team ${teamId}`);
            return res.status(400).json({ message: 'User is already a member of this team.' });
        }

        // [REMOVED] Pending invitation restriction
        // const existingInvite = await Invitation.findOne({ team: teamId, invitee: inviteeId, status: 'pending' });
        // if (existingInvite) {
        //     console.log(`❌ Existing pending invitation found for user ${inviteeId} to team ${teamId}`);
        //     return res.status(400).json({ message: 'An invitation is already pending for this user to join this team.' });
        // }

        console.log(`✅ All validations passed, creating invitation...`);

        // Create and save invitation
        const invitation = new Invitation({
            team: teamId,
            inviter: inviterId,
            invitee: inviteeId,
            status: 'pending'
        });
        await invitation.save();
        console.log(`✅ Invitation created: ${invitation._id}`);

        // Send email notification
        console.log(`📧 Sending email notification to ${invitee.email}...`);
        const emailResult = await sendInvitationEmail(
            inviter.name,
            team.name,
            invitee.email,
            false // This is for existing users
        );

        if (emailResult.success) {
            console.log(`✅ Invitation email sent successfully`);
        } else {
            console.warn(`⚠️ Email sending failed:`, emailResult.error);
            // Don't fail the invitation creation if email fails
        }

        // Populate for response
        const populatedInvite = await Invitation.findById(invitation._id)
            .populate('team', 'name')
            .populate('inviter', 'name')
            .populate('invitee', 'name');

        console.log(`✅ Team invitation completed successfully`);
        res.status(201).json({
            ...populatedInvite.toObject(),
            emailSent: emailResult.success
        });

    } catch (err) {
        console.error('❌ Error in team invitation:', err);
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

// @desc    Get pending invitations for a specific team
// @route   GET /api/invitations/team/:teamId
// @access  Private (Team members only)
router.get('/team/:teamId', protect, async (req, res, next) => {
    const { teamId } = req.params;
    const userId = req.user.id;

    try {
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: 'Team not found.' });
        }

        // Authorization: Check if the user is a member of the team
        if (!isTeamMember(team, userId)) {
            return res.status(403).json({ message: 'You are not authorized to view this team\'s invitations.' });
        }

        const pendingInvites = await Invitation.find({ team: teamId, status: 'pending' })
            .select('invitee') // We only need the invitee ID on the frontend
            .lean(); 

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
                
                // Handle team chat creation/activation when new member joins via invitation
                try {
                    const io = req.app.get('socketio');
                    const userSockets = req.app.get('userSockets');
                    
                    const teamChatResult = await handleMemberJoinedTeam(
                        team._id.toString(), 
                        userId.toString(), 
                        io, 
                        userSockets
                    );
                    
                    if (teamChatResult.success && teamChatResult.teamChat) {
                        console.log(`✅ Team chat activated for team ${team._id} via invitation (${teamChatResult.memberCount} members)`);
                    } else {
                        console.log(`ℹ️ Team chat not activated via invitation: ${teamChatResult.message || 'Unknown reason'}`);
                    }
                } catch (teamChatError) {
                    console.error('❌ Error managing team chat during invitation acceptance:', teamChatError);
                    // Don't fail the invitation acceptance if team chat fails
                }
                
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

// @desc    Send an external email invitation (for people without accounts)
// @route   POST /api/invitations/email
// @access  Private (Team creator only)
router.post('/email', protect, async (req, res, next) => {
    const { teamId, inviteeEmail, inviteeName } = req.body;
    const inviterId = req.user.id;

    console.log(`=== EXTERNAL EMAIL INVITATION DEBUG ===`);
    console.log(`Inviter: ${req.user.name} (${inviterId})`);
    console.log(`Team ID: ${teamId}`);
    console.log(`Invitee Email: ${inviteeEmail}`);
    console.log(`Invitee Name: ${inviteeName}`);

    try {
        // Basic validation
        if (!teamId || !inviteeEmail) {
            return res.status(400).json({ message: 'Team ID and invitee email are required.' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(inviteeEmail)) {
            return res.status(400).json({ message: 'Invalid email format.' });
        }

        const team = await Team.findById(teamId);
        const inviter = await User.findById(inviterId);

        if (!team) {
            console.log(`❌ Team ${teamId} not found`);
            return res.status(404).json({ message: 'Team not found.' });
        }
        if (!inviter) {
            console.log(`❌ Inviter ${inviterId} not found`);
            return res.status(404).json({ message: 'Inviter not found.' });
        }

        console.log(`Team: "${team.name}" (${team.university})`);
        console.log(`Inviter: ${inviter.name} (${inviter.email}) - ${inviter.university}`);

        // Authorization: Check if inviter is the creator
        if (!team.createdBy.equals(inviterId)) {
            console.log(`❌ Authorization failed: ${inviterId} is not creator of team ${teamId}`);
            return res.status(403).json({ message: 'Only the team creator can send invitations.' });
        }

        // Check if someone with this email already has an account and is a team member
        const existingUser = await User.findOne({ email: inviteeEmail });
        if (existingUser) {
            // Check if they're already a member
            if (isTeamMember(team, existingUser._id)) {
                console.log(`❌ User with email ${inviteeEmail} is already a member`);
                return res.status(400).json({ message: 'A user with this email is already a member of this team.' });
            }

            // Check for existing pending invitation
            const existingInvite = await Invitation.findOne({ 
                team: teamId, 
                invitee: existingUser._id, 
                status: 'pending' 
            });
            if (existingInvite) {
                console.log(`❌ Existing pending invitation found for email ${inviteeEmail}`);
                return res.status(400).json({ message: 'An invitation is already pending for this user.' });
            }

            // If user exists, redirect to regular invitation workflow
            console.log(`🔄 User exists, redirecting to regular invitation workflow`);
            return res.status(400).json({ 
                message: 'A user with this email already exists. Please use the regular invitation feature to invite existing users.',
                userExists: true,
                userId: existingUser._id
            });
        }

        console.log(`✅ Email is available for external invitation`);

        // Send external email invitation
        console.log(`📧 Sending external invitation email to ${inviteeEmail}...`);
        const emailResult = await sendInvitationEmail(
            inviter.name,
            team.name,
            inviteeEmail,
            true // This is for external users
        );

        if (!emailResult.success) {
            console.error(`❌ Failed to send external invitation email:`, emailResult.error);
            
            // Check if it's a configuration issue
            if (emailResult.error.includes('Gmail service not configured') || emailResult.error.includes('Missing environment variables')) {
                return res.status(500).json({ 
                    message: 'Gmail service is not configured properly. Please contact your administrator.',
                    error: emailResult.error,
                    isConfigurationError: true
                });
            }
            
            return res.status(500).json({ 
                message: 'Failed to send invitation email. Please try again later.',
                error: emailResult.error
            });
        }

        console.log(`✅ External invitation email sent successfully`);

        // Log the external invitation (optional: store in database for tracking)
        // You could create an ExternalInvitation model to track these
        const invitationRecord = {
            teamId,
            teamName: team.name,
            inviterName: inviter.name,
            inviterEmail: inviter.email,
            inviteeEmail,
            inviteeName: inviteeName || 'Unknown',
            sentAt: new Date(),
            messageId: emailResult.messageId
        };

        console.log(`📝 External invitation logged:`, invitationRecord);

        res.status(201).json({
            message: 'External invitation sent successfully!',
            inviteeEmail,
            teamName: team.name,
            emailSent: true,
            messageId: emailResult.messageId
        });

    } catch (err) {
        console.error('❌ Error in external email invitation:', err);
        next(err);
    }
});


module.exports = router;
