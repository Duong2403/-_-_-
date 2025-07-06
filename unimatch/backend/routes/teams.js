const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const Match = require('../models/Match'); // Need Match model here for potential matches route

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private
router.post('/', protect, async (req, res, next) => {
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
  const createdBy = req.user.id;
  const university = req.user.university;

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

// @desc    Get all teams for the logged-in user's university
// @route   GET /api/teams
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    // Find teams where user's university matches and user is NOT a member
    const teams = await Team.find({
      university: req.user.university,
      members: { $ne: req.user.id } // Exclude teams the user is already in
    }).populate('members', 'name email');
    res.json(teams);
  } catch (err) {
    next(err);
  }
});

// @desc    Get teams that the current user is a member of
// @route   GET /api/teams/my-teams
// @access  Private
router.get('/my-teams', protect, async (req, res, next) => {
    try {
        const myTeams = await Team.find({ members: req.user.id })
            .populate('members', 'name email')
            .sort({ createdAt: -1 }); // Show most recent first
        res.json(myTeams);
    } catch (err) {
        next(err);
    }
});


// @desc    Get a single team by ID
// @route   GET /api/teams/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id).populate('members', 'name email');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    // Optional: Check if user has permission to view (e.g., same university)
    if (team.university !== req.user.university) {
        return res.status(403).json({ message: 'Not authorized to view this team' });
    }

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
        if (team.university !== req.user.university) {
            return res.status(400).json({ message: 'You must be from the same university to join' });
        }

        // TODO: Add logic for team capacity if needed

        team.members.push(req.user.id);
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
    try {
        const team = await Team.findById(req.params.id);

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Check if user is in the team
        if (!team.members.some(memberId => memberId.equals(req.user.id))) {
            return res.status(400).json({ message: 'User is not a member of this team' });
        }

                 // If the user is the creator and the only member, delete the team
         if (team.createdBy.equals(req.user.id) && team.members.length === 1) {
             await team.deleteOne();
             return res.json({ message: 'Team deleted as the last member (creator) left.' });
         }
        
        // If the user is the creator and there are other members, they cannot leave.
        // They must delete the team or transfer ownership (future feature).
        if (team.createdBy.equals(req.user.id)) {
             return res.status(400).json({ message: 'Creator cannot leave the team. Please delete the team instead.' });
        }

        // Remove the user from the members array
        team.members = team.members.filter(memberId => !memberId.equals(req.user.id));
        await team.save();
        
        const populatedTeam = await Team.findById(team._id).populate('members', 'name email');
        res.json(populatedTeam);
    } catch (err) {
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
        //    - Status 'active', 'forming', or 'matched'
        const potentialTeams = await Team.find({
            _id: { $nin: Array.from(excludedTeamIds) }, // Exclude own team and teams with existing matches
            university: userTeam.university, // Must be same university
            status: { $in: ['forming', 'active', 'matched'] } // Include 'matched' status
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
