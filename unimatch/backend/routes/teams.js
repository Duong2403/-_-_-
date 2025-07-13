const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const Match = require('../models/Match'); // Need Match model here for potential matches route
const { handleMemberJoinedTeam, handleMemberLeftTeam } = require('../utils/teamChatManager');

// Import university matching utility
const path = require('path');
const { areUniversitiesEqual, normalizeUniversityName } = require(path.join(__dirname, '../../frontend/src/constants/universities.js'));

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private
router.post('/', protect, async (req, res, next) => {
  const { 
    name, 
    description,
    university,
    teamComposition,
    teamVibe,
    topInterests,
    meetingPurpose,
    targetTeamVibe,
    availability,
    preferredLocation,
    teamGender
  } = req.body;
  const createdBy = req.user.id;

  try {
    const team = new Team({
      name,
      description,
      members: [createdBy], // Creator is the first member
      createdBy,
      university,
      teamComposition,
      teamVibe,
      topInterests,
      meetingPurpose,
      targetTeamVibe,
      availability,
      preferredLocation,
      teamGender
    });

    const createdTeam = await team.save();
    // Populate member details for the response
    const populatedTeam = await Team.findById(createdTeam._id).populate('members', 'name email');
    res.status(201).json(populatedTeam);
  } catch (err) {
    next(err);
  }
});

// @desc    Get all teams for discovery based on school filter
// @route   GET /api/teams
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { school } = req.query; // Optional school filter
    
    console.log(`=== TEAMS DISCOVERY DEBUG ===`);
    console.log(`User ${req.user.name} (${req.user.email}) requesting teams discovery`);
    console.log(`User university: "${req.user.university}"`);
    console.log(`School filter: "${school}"`);
    
    // Get all teams that are ready for discovery
    const query = {
      members: { $ne: req.user.id }, // Exclude teams the user is already in
      status: { $in: ['active', 'matched'] } // Only show teams ready for discovery
    };
    
    console.log(`Base query:`, query);
    
    let teams = await Team.find(query).populate({
      path: 'members',
      select: 'name email',
      match: { _id: { $exists: true } }
    });
    
    console.log(`Found ${teams.length} teams before university filtering`);
    
    // Apply flexible school filtering if specified
    if (school) {
      console.log(`Applying school filter: "${school}"`);
      const originalCount = teams.length;
      teams = teams.filter(team => {
        const match = areUniversitiesEqual(team.university, school);
        console.log(`Team "${team.name}" (${team.university}) matches filter "${school}": ${match}`);
        return match;
      });
      console.log(`After school filtering: ${teams.length}/${originalCount} teams`);
    } else {
      // If no school filter specified, only show teams from the same university as the user
      console.log(`No school filter specified, filtering by user university: "${req.user.university}"`);
      const originalCount = teams.length;
      teams = teams.filter(team => {
        const match = areUniversitiesEqual(team.university, req.user.university);
        console.log(`Team "${team.name}" (${team.university}) matches user university "${req.user.university}": ${match}`);
        return match;
      });
      console.log(`After user university filtering: ${teams.length}/${originalCount} teams`);
    }
    
    console.log(`✅ Returning ${teams.length} discoverable teams`);
    teams.forEach(team => {
      console.log(`  - ${team.name} (${team.university}) - ${team.status} - ${team.members.length} members`);
    });
    
    res.json(teams);
  } catch (err) {
    console.error('❌ Error in teams discovery:', err);
    next(err);
  }
});

// @desc    Get teams that the current user is a member of
// @route   GET /api/teams/my-teams
// @access  Private
router.get('/my-teams', protect, async (req, res, next) => {
    try {
        const myTeams = await Team.find({ members: req.user.id })
            .populate({
                path: 'members',
                select: 'name email',
                match: { _id: { $exists: true } }
            })
            .sort({ createdAt: -1 }); // Show most recent first
        res.json(myTeams);
    } catch (err) {
        next(err);
    }
});

// @desc    Get all discoverable teams for invitations (unrestricted)
// @route   GET /api/teams/all-discoverable
// @access  Private
router.get('/all-discoverable', protect, async (req, res, next) => {
    try {
        const { university, status, search } = req.query;
        
        // Build base query - exclude teams user is already in
        const query = {
            members: { $ne: req.user.id }, // Exclude teams the user is already in
            status: { $ne: 'inactive' } // Exclude inactive teams
        };
        
        // Apply filters if provided
        if (university) {
            query.university = university;
        }
        
        if (status) {
            query.status = status;
        }
        
        let teams = await Team.find(query)
            .populate({
                path: 'members',
                select: 'name email',
                match: { _id: { $exists: true } } // Only populate existing users
            })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 }); // Most recent first
        
        // Apply search filter if provided
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            teams = teams.filter(team => 
                searchRegex.test(team.name) || 
                searchRegex.test(team.description) ||
                searchRegex.test(team.university)
            );
        }
        
        console.log(`All discoverable teams found: ${teams.length} teams`);
        res.json(teams);
        
    } catch (err) {
        next(err);
    }
});


// @desc    Get a single team by ID
// @route   GET /api/teams/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    // Allow viewing team details from any university for discovery purposes
    // University restrictions are enforced at the join/apply level
    res.json(team);
  } catch (err) {
    next(err);
  }
});

// @desc    Update a team
// @route   PUT /api/teams/:id
// @access  Private (Team creator only)
router.put('/:id', protect, async (req, res, next) => {
  try {
    let team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is the creator
    if (team.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized to update this team' });
    }

    const { 
      name, 
      description,
      teamComposition,
      teamVibe,
      topInterests,
      meetingPurpose,
      targetTeamVibe,
      availability,
      preferredLocation,
      teamGender
    } = req.body;

    // Update fields
    team.name = name || team.name;
    team.description = description || team.description;
    team.teamComposition = teamComposition || team.teamComposition;
    team.teamVibe = teamVibe || team.teamVibe;
    team.topInterests = topInterests || team.topInterests;
    team.meetingPurpose = meetingPurpose || team.meetingPurpose;
    team.targetTeamVibe = targetTeamVibe || team.targetTeamVibe;
    team.availability = availability || team.availability;
    team.preferredLocation = preferredLocation || team.preferredLocation;
    team.teamGender = teamGender || team.teamGender;

    const updatedTeam = await team.save();
    const populatedTeam = await Team.findById(updatedTeam._id).populate('members', 'name email');
    res.json(populatedTeam);
  } catch (err) {
    next(err);
  }
});

// @desc    Delete a team
// @route   DELETE /api/teams/:id
// @access  Private (Team creator only)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized to delete this team' });
    }

    await team.deleteOne();

    res.json({ message: 'Team removed' });
  } catch (err) {
    next(err);
  }
});

// @desc    Join a team
// @route   POST /api/teams/:id/join
// @access  Private
router.post('/:id/join', protect, async (req, res, next) => {
    try {
        const team = await Team.findById(req.params.id);

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Check if user is already in the team
        if (team.members.includes(req.user.id)) {
            return res.status(400).json({ message: 'User already in this team' });
        }

        // Check if user is from the same university
        if (!areUniversitiesEqual(team.university, req.user.university)) {
            return res.status(400).json({ message: 'You must be from the same university to join' });
        }

        // TODO: Add logic for team capacity if needed

        team.members.push(req.user.id);
        await team.save();
        
        // Handle team chat creation/activation when new member joins directly
        try {
            const io = req.app.get('socketio');
            const userSockets = req.app.get('userSockets');
            
            const teamChatResult = await handleMemberJoinedTeam(
                team._id.toString(), 
                req.user.id.toString(), 
                io, 
                userSockets
            );
            
            if (teamChatResult.success && teamChatResult.teamChat) {
                console.log(`✅ Team chat activated for team ${team._id} via direct join (${teamChatResult.memberCount} members)`);
            } else {
                console.log(`ℹ️ Team chat not activated via direct join: ${teamChatResult.message || 'Unknown reason'}`);
            }
        } catch (teamChatError) {
            console.error('❌ Error managing team chat during direct join:', teamChatError);
            // Don't fail the team join if team chat fails
        }

        const populatedTeam = await Team.findById(team._id).populate('members', 'name email');
        res.json(populatedTeam);
    } catch (err) {
        next(err);
    }
});

// @desc    Activate a team (change status from 'forming' to 'active')
// @route   POST /api/teams/:id/activate
// @access  Private (Team creator only)
router.post('/:id/activate', protect, async (req, res, next) => {
    try {
        const team = await Team.findById(req.params.id);

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Check if user is the creator
        if (team.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Only the team creator can activate the team' });
        }

        // Check if team is in forming status
        if (team.status !== 'forming') {
            return res.status(400).json({ message: `Team is already ${team.status}. Only forming teams can be activated.` });
        }

        // Activate the team
        team.status = 'active';
        await team.save();

        const populatedTeam = await Team.findById(team._id).populate('members', 'name email');
        res.json(populatedTeam);
    } catch (err) {
        next(err);
    }
});

// @desc    Leave a team
// @route   POST /api/teams/:id/leave
// @access  Private
router.post('/:id/leave', protect, async (req, res, next) => {
    console.log(`=== TEAM LEAVE DEBUG ===`);
    console.log(`User: ${req.user.name} (${req.user.id})`);
    console.log(`Team ID: ${req.params.id}`);
    
    try {
        const team = await Team.findById(req.params.id);

        if (!team) {
            console.log(`❌ Team ${req.params.id} not found`);
            return res.status(404).json({ message: 'Team not found' });
        }

        console.log(`Team found: "${team.name}" with ${team.members.length} members`);

        // Check if user is in the team
        if (!team.members.some(memberId => memberId.equals(req.user.id))) {
            console.log(`❌ User ${req.user.id} is not a member of team ${req.params.id}`);
            return res.status(400).json({ message: 'User is not a member of this team' });
        }

        // If the user is the creator and the only member, delete the team
        if (team.createdBy.equals(req.user.id) && team.members.length === 1) {
            console.log(`🗑️ Deleting team as last member (creator) is leaving`);
            await team.deleteOne();
            
            // Emit real-time event for team deletion
            const io = req.app.get('socketio');
            if (io) {
                const userSocket = req.app.get('userSockets')?.[req.user.id];
                if (userSocket) {
                    io.to(userSocket).emit('teamMembershipChanged', {
                        action: 'team_deleted',
                        teamId: team._id,
                        teamName: team.name,
                        message: `Team "${team.name}" was deleted`
                    });
                    console.log(`✅ Notified user about team deletion`);
                }
            }
            
            return res.json({ message: 'Team deleted as the last member (creator) left.' });
        }
        
        // If the user is the creator and there are other members, they cannot leave.
        // They must delete the team or transfer ownership (future feature).
        if (team.createdBy.equals(req.user.id)) {
            console.log(`❌ Creator cannot leave team with other members`);
            return res.status(400).json({ message: 'Creator cannot leave the team. Please delete the team instead.' });
        }

        console.log(`✅ User can leave team. Removing from members...`);

        // Remove the user from the members array
        const originalMemberCount = team.members.length;
        team.members = team.members.filter(memberId => !memberId.equals(req.user.id));
        await team.save();
        
        console.log(`✅ User removed from team. Members: ${originalMemberCount} -> ${team.members.length}`);
        
        // Handle team chat when member leaves
        try {
            const io = req.app.get('socketio');
            const userSockets = req.app.get('userSockets');
            
            const teamChatResult = await handleMemberLeftTeam(
                req.params.id.toString(), 
                req.user.id.toString(), 
                io, 
                userSockets
            );
            
            if (teamChatResult.success) {
                if (teamChatResult.teamChat) {
                    console.log(`✅ Team chat remains active after member left (${teamChatResult.memberCount} members)`);
                } else {
                    console.log(`🔒 Team chat deactivated after member left: ${teamChatResult.message}`);
                }
            }
        } catch (teamChatError) {
            console.error('❌ Error managing team chat during member leave:', teamChatError);
            // Don't fail the leave operation if team chat fails
        }
        
        // Clean up join request records when user leaves team
        try {
            const JoinRequest = require('../models/JoinRequest');
            const updateResult = await JoinRequest.updateMany(
                { 
                    team: req.params.id,
                    applicant: req.user.id,
                    status: 'approved'
                },
                { 
                    status: 'left',
                    reviewedAt: new Date()
                }
            );
            console.log(`✅ Updated ${updateResult.modifiedCount} join request(s) to 'left' status`);
        } catch (joinRequestError) {
            console.error('❌ Error updating join request status:', joinRequestError);
            // Don't fail the leave operation if join request update fails
        }
        
        // Emit real-time events
        const io = req.app.get('socketio');
        if (io) {
            // Notify the leaving user
            const userSocket = req.app.get('userSockets')?.[req.user.id];
            if (userSocket) {
                io.to(userSocket).emit('teamMembershipChanged', {
                    action: 'left',
                    teamId: team._id,
                    teamName: team.name,
                    message: `You've left "${team.name}"`
                });
                console.log(`✅ Notified leaving user`);
            }
            
            // Notify remaining team members
            const remainingMembers = await User.find({ _id: { $in: team.members } }).select('_id');
            remainingMembers.forEach(member => {
                const memberSocket = req.app.get('userSockets')?.[member._id];
                if (memberSocket) {
                    io.to(memberSocket).emit('teamMembershipChanged', {
                        action: 'member_left',
                        teamId: team._id,
                        teamName: team.name,
                        leftMemberName: req.user.name,
                        message: `${req.user.name} left "${team.name}"`
                    });
                }
            });
            console.log(`✅ Notified ${remainingMembers.length} remaining team members`);
        }
        
        const populatedTeam = await Team.findById(team._id).populate('members', 'name email');
        console.log(`✅ Team leave completed successfully`);
        res.json(populatedTeam);
    } catch (err) {
        console.error('❌ Error in team leave:', err);
        next(err);
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
            console.log(`Team with ID ${teamId} not found.`);
            return res.status(404).json({ message: 'Your team not found.' });
        }
        console.log(`User's team: ${userTeam.name} (${userTeam.university})`);
        if (!userTeam.members.some(member => member.equals(userId))) {
            console.log(`User ${userId} is not a member of team ${teamId}.`);
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
        console.log("Excluded team IDs:", Array.from(excludedTeamIds));

        // --- Debugging: Find all other teams from the same university and check their status/exclusion ---
        const allOtherTeamsSameUniversity = await Team.find({
            _id: { $ne: teamId }, // Exclude the user's own team
            university: userTeam.university, // Must be same university
        })
        .select('name university status');

        console.log("All other teams from same university:", allOtherTeamsSameUniversity.map(team => ({
            name: team.name,
            university: team.university,
            status: team.status,
            isExcluded: excludedTeamIds.has(team._id.toString())
        })));
        // --- End Debugging ---


        // 3. Find potential teams:
        //    - Same university
        //    - Not the user's own team
        //    - Not already matched or having a pending request
        //    - Status 'active' or 'matched' (exclude 'forming' teams)
        const potentialTeams = await Team.find({
            _id: { $nin: Array.from(excludedTeamIds) }, // Exclude own team and teams with existing matches
            university: userTeam.university, // Must be same university
            status: { $in: ['active', 'matched'] } // Only include active and matched teams
        })
        .select('name description members university status') // Select fields to return
        .populate('members', 'name'); // Populate member names for display

        console.log("Potential teams found:", potentialTeams.map(team => ({ name: team.name, university: team.university, status: team.status })));

        res.json(potentialTeams);

    } catch (err) {
        next(err);
    }
});

module.exports = router;
