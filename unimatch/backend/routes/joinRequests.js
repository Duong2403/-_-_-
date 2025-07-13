const express = require('express');
const router = express.Router();
const JoinRequest = require('../models/JoinRequest');
const Team = require('../models/Team');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { sendJoinRequestNotificationEmail } = require('../config/emailConfig');
const { handleMemberJoinedTeam } = require('../utils/teamChatManager');

// Import university matching utility for proper validation
const path = require('path');
const { areUniversitiesEqual, normalizeUniversityName } = require(path.join(__dirname, '../../frontend/src/constants/universities.js'));

// @desc    Send a join request to a team
// @route   POST /api/join-requests
// @access  Private
router.post('/', protect, async (req, res, next) => {
  const { teamId, message } = req.body;
  const applicantId = req.user.id;

  console.log(`=== JOIN REQUEST DEBUG ===`);
  console.log(`User ${req.user.name} (${req.user.email}) attempting to join team ${teamId}`);
  console.log(`User university: "${req.user.university}"`);

  try {
    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) {
      console.log(`❌ Team ${teamId} not found`);
      return res.status(404).json({ message: 'Team not found' });
    }

    console.log(`Team found: "${team.name}" (${team._id})`);
    console.log(`Team university: "${team.university}"`);

    // Check if user is already a member
    if (team.members.includes(applicantId)) {
      console.log(`❌ User ${applicantId} is already a member of team ${teamId}`);
      return res.status(400).json({ message: 'You are already a member of this team' });
    }

    // Implement proper university validation using the same logic as discovery
    const userUniversity = req.user.university;
    const teamUniversity = team.university;
    
    console.log(`Checking university match: user="${userUniversity}" vs team="${teamUniversity}"`);
    
    const universitiesMatch = areUniversitiesEqual(userUniversity, teamUniversity);
    console.log(`Universities equal: ${universitiesMatch}`);
    
    if (!universitiesMatch) {
      console.log(`❌ University mismatch: user="${userUniversity}" team="${teamUniversity}"`);
      const normalizedUser = normalizeUniversityName(userUniversity);
      const normalizedTeam = normalizeUniversityName(teamUniversity);
      console.log(`Normalized: user="${normalizedUser}" team="${normalizedTeam}"`);
      
      return res.status(400).json({ 
        message: `You can only join teams from your university. Your university: ${normalizedUser}, Team university: ${normalizedTeam}` 
      });
    }

    console.log(`✅ University validation passed`);

    // Check if there's already any request (pending, approved, or rejected)
    const existingRequest = await JoinRequest.findOne({
      team: teamId,
      applicant: applicantId
    });

    if (existingRequest) {
      console.log(`Found existing request with status: ${existingRequest.status}`);
      if (existingRequest.status === 'pending') {
        return res.status(400).json({ message: 'You already have a pending request for this team' });
      } else if (existingRequest.status === 'approved') {
        return res.status(400).json({ message: 'You have already been approved to join this team' });
      } else if (existingRequest.status === 'rejected') {
        return res.status(400).json({ message: 'Your previous request to this team was rejected. Please contact the team directly if you wish to apply again.' });
      }
    }

    console.log(`✅ No existing request found, creating new join request`);

    // Create join request
    const joinRequest = new JoinRequest({
      team: teamId,
      applicant: applicantId,
      message: message || ''
    });

    await joinRequest.save();
    console.log(`✅ Join request created successfully: ${joinRequest._id}`);

    // Send email notification to team creator
    try {
      const teamCreator = await User.findById(team.createdBy).select('name email');
      if (teamCreator && teamCreator.email) {
        console.log(`📧 Sending join request notification to team creator: ${teamCreator.email}`);
        const emailResult = await sendJoinRequestNotificationEmail(
          req.user.name,
          team.name,
          teamCreator.email
        );

        if (emailResult.success) {
          console.log(`✅ Join request notification email sent successfully`);
        } else {
          console.warn(`⚠️ Join request notification email failed:`, emailResult.error);
          // Don't fail the join request if email fails
        }
      } else {
        console.warn(`⚠️ Team creator email not found, skipping notification`);
      }
    } catch (emailError) {
      console.error('❌ Error sending join request notification email:', emailError);
      // Don't fail the join request if email fails
    }

    // Populate the request for response
    const populatedRequest = await JoinRequest.findById(joinRequest._id)
      .populate('team', 'name university')
      .populate('applicant', 'name email university');

    console.log(`✅ Join request completed successfully`);
    res.status(201).json(populatedRequest);
  } catch (err) {
    console.error('❌ Error creating join request:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      name: err.name
    });
    
    // Handle MongoDB duplicate key errors gracefully
    if (err.code === 11000) {
      return res.status(400).json({ 
        message: 'You already have a pending request for this team' 
      });
    }
    
    next(err);
  }
});

// @desc    Get join requests for teams created by the logged-in user
// @route   GET /api/join-requests/my-teams
// @access  Private
router.get('/my-teams', protect, async (req, res, next) => {
  try {
    // Find teams created by the user
    const myTeams = await Team.find({ createdBy: req.user.id }).select('_id');
    const myTeamIds = myTeams.map(team => team._id);

    // Find join requests for those teams
    const joinRequests = await JoinRequest.find({
      team: { $in: myTeamIds },
      status: 'pending'
    })
      .populate('team', 'name university')
      .populate('applicant', 'name email university bio photos')
      .sort({ createdAt: -1 });

    res.json(joinRequests);
  } catch (err) {
    next(err);
  }
});

// @desc    Get join requests sent by the logged-in user
// @route   GET /api/join-requests/my-requests
// @access  Private
router.get('/my-requests', protect, async (req, res, next) => {
  try {
    const joinRequests = await JoinRequest.find({
      applicant: req.user.id
    })
      .populate('team', 'name university')
      .sort({ createdAt: -1 });

    res.json(joinRequests);
  } catch (err) {
    next(err);
  }
});

// @desc    Approve or reject a join request
// @route   PUT /api/join-requests/:id
// @access  Private (Team creator only)
router.put('/:id', protect, async (req, res, next) => {
  const { status } = req.body; // 'approved' or 'rejected'

  console.log(`=== JOIN REQUEST APPROVAL DEBUG ===`);
  console.log(`Request ID: ${req.params.id}`);
  console.log(`Status: ${status}`);
  console.log(`Reviewer: ${req.user.name} (${req.user.id})`);

  try {
    const joinRequest = await JoinRequest.findById(req.params.id)
      .populate('team')
      .populate('applicant');

    if (!joinRequest) {
      console.log(`❌ Join request ${req.params.id} not found`);
      return res.status(404).json({ message: 'Join request not found' });
    }

    console.log(`Join request found: ${joinRequest.applicant.name} -> ${joinRequest.team.name}`);

    // Check if user is the team creator
    if (joinRequest.team.createdBy.toString() !== req.user.id) {
      console.log(`❌ Authorization failed: ${req.user.id} is not creator of team ${joinRequest.team._id}`);
      return res.status(403).json({ message: 'Only team creator can approve/reject requests' });
    }

    // Check if request is still pending
    if (joinRequest.status !== 'pending') {
      console.log(`❌ Request already processed with status: ${joinRequest.status}`);
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    // Update request status
    joinRequest.status = status;
    joinRequest.reviewedBy = req.user.id;
    joinRequest.reviewedAt = new Date();

    await joinRequest.save();
    console.log(`✅ Join request status updated to: ${status}`);

    // If approved, add user to team and create a match record for chat functionality
    if (status === 'approved') {
      try {
        const team = await Team.findById(joinRequest.team._id);
        if (!team) {
          console.error('❌ Team not found during approval process:', joinRequest.team._id);
          return res.status(404).json({ message: 'Team not found' });
        }
        
        // Add user to team if not already a member
        const applicantId = joinRequest.applicant._id;
        if (!team.members.includes(applicantId)) {
          team.members.push(applicantId);
          await team.save();
          console.log(`✅ Added user ${applicantId} to team ${team._id} (${team.name})`);
          
          // Emit real-time event for team membership change
          const io = req.app.get('socketio');
          if (io) {
            // Notify the applicant about successful join
            const userSocket = req.app.get('userSockets')?.[applicantId];
            if (userSocket) {
              io.to(userSocket).emit('teamMembershipChanged', {
                action: 'joined',
                teamId: team._id,
                teamName: team.name,
                message: `You've been approved to join "${team.name}"!`
              });
              console.log(`✅ Notified user ${applicantId} about team join`);
            }
            
            // Notify all team members about new member
            const teamMembers = await User.find({ _id: { $in: team.members } }).select('_id');
            teamMembers.forEach(member => {
              const memberSocket = req.app.get('userSockets')?.[member._id];
              if (memberSocket && member._id.toString() !== applicantId.toString()) {
                io.to(memberSocket).emit('teamMembershipChanged', {
                  action: 'member_added',
                  teamId: team._id,
                  teamName: team.name,
                  newMemberName: joinRequest.applicant.name,
                  message: `${joinRequest.applicant.name} joined "${team.name}"`
                });
              }
            });
            console.log(`✅ Notified team members about new member`);
          }
        } else {
          console.log(`⚠️ User ${applicantId} was already a member of team ${team._id}`);
        }
        
        console.log(`✅ User ${applicantId} successfully joined team ${team._id}`);
        
        // Optional: Update team status if needed
        if (team.status === 'forming' && team.members.length >= 2) {
          team.status = 'active';
          await team.save();
          console.log(`✅ Team ${team._id} status updated to active`);
        }
        
        // Handle team chat creation/activation when new member joins
        try {
          const io = req.app.get('socketio');
          const userSockets = req.app.get('userSockets');
          
          const teamChatResult = await handleMemberJoinedTeam(
            team._id.toString(), 
            applicantId.toString(), 
            io, 
            userSockets
          );
          
          if (teamChatResult.success && teamChatResult.teamChat) {
            console.log(`✅ Team chat activated for team ${team._id} (${teamChatResult.memberCount} members)`);
          } else {
            console.log(`ℹ️ Team chat not activated: ${teamChatResult.message || 'Unknown reason'}`);
          }
        } catch (teamChatError) {
          console.error('❌ Error managing team chat:', teamChatError);
          // Don't fail the join request if team chat fails
        }
      } catch (approvalError) {
        console.error('❌ Error during join request approval process:', approvalError);
        // Don't fail the entire request if team update fails
        // The join request status was still updated
        return res.status(500).json({ 
          message: 'Join request processed but team update failed. Please refresh and try again.' 
        });
      }
    }

    // Return updated request
    const updatedRequest = await JoinRequest.findById(joinRequest._id)
      .populate('team', 'name university')
      .populate('applicant', 'name email university')
      .populate('reviewedBy', 'name');

    console.log(`✅ Join request approval completed successfully`);
    res.json(updatedRequest);
  } catch (err) {
    console.error('❌ Error in join request approval:', err);
    next(err);
  }
});

// @desc    Cancel a join request
// @route   DELETE /api/join-requests/:id
// @access  Private (Applicant only)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const joinRequest = await JoinRequest.findById(req.params.id);

    if (!joinRequest) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    // Check if user is the applicant
    if (joinRequest.applicant.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only cancel your own requests' });
    }

    // Check if request is still pending
    if (joinRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot cancel a processed request' });
    }

    await joinRequest.deleteOne();

    res.json({ message: 'Join request cancelled' });
  } catch (err) {
    next(err);
  }
});

module.exports = router; 