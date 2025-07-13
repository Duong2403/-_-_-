const TeamChat = require('../models/TeamChat');
const Team = require('../models/Team');
const User = require('../models/User');

/**
 * Ensures team chat is active when team has 2+ members
 * Creates team chat if it doesn't exist and team is active
 * Manages socket room membership for all team members
 * 
 * @param {string} teamId - The team ID to check/create chat for
 * @param {object} io - Socket.io instance (optional, for real-time features)
 * @param {object} userSockets - User socket mapping (optional, for real-time features)
 * @returns {object} Result object with success status and team chat info
 */
const ensureTeamChatActive = async (teamId, io = null, userSockets = null) => {
  try {
    console.log(`=== TEAM CHAT MANAGER: Ensuring chat for team ${teamId} ===`);
    
    // Get team with populated members
    const team = await Team.findById(teamId).populate('members', '_id name');
    if (!team) {
      console.log(`❌ Team ${teamId} not found`);
      return { 
        success: false, 
        error: 'Team not found',
        teamChat: null 
      };
    }

    const memberCount = team.members ? team.members.length : 0;
    console.log(`Team "${team.name}" has ${memberCount} members`);

    // Check if team has 2+ members (active team)
    if (memberCount < 2) {
      console.log(`⏳ Team has < 2 members, no team chat needed yet`);
      
      // If team chat exists but team is now < 2 members, deactivate it
      const existingTeamChat = await TeamChat.findOne({ team: teamId });
      if (existingTeamChat && existingTeamChat.isActive) {
        existingTeamChat.isActive = false;
        await existingTeamChat.save();
        console.log(`🔒 Deactivated team chat for team ${teamId} (< 2 members)`);
        
        // Remove all members from socket room if io is available
        if (io && userSockets) {
          await removeAllMembersFromTeamRoom(teamId, team.members, io, userSockets);
        }
      }
      
      return { 
        success: true, 
        teamChat: null, 
        message: 'Team has less than 2 members, no chat needed' 
      };
    }

    // Team has 2+ members, ensure team chat exists and is active
    let teamChat = await TeamChat.findOne({ team: teamId });
    
    if (!teamChat) {
      // Create new team chat
      teamChat = new TeamChat({
        team: teamId,
        createdBy: team.createdBy,
        isActive: true
      });
      await teamChat.save();
      console.log(`✅ Created new team chat for team ${teamId}`);
    } else if (!teamChat.isActive) {
      // Reactivate existing team chat
      teamChat.isActive = true;
      await teamChat.save();
      console.log(`🔄 Reactivated team chat for team ${teamId}`);
    } else {
      console.log(`✅ Team chat already exists and is active for team ${teamId}`);
    }

    // Update team status to active if it's still forming
    if (team.status === 'forming') {
      team.status = 'active';
      await team.save();
      console.log(`📈 Updated team ${teamId} status to 'active'`);
    }

    // Join all team members to socket room if io is available
    if (io && userSockets) {
      await joinAllMembersToTeamRoom(teamId, team.members, io, userSockets, team.name);
    }

    // Get populated team chat for response
    const populatedTeamChat = await TeamChat.findById(teamChat._id)
      .populate('team', 'name university members')
      .populate('createdBy', 'name');

    console.log(`✅ Team chat management completed for team ${teamId}`);
    
    return {
      success: true,
      teamChat: populatedTeamChat,
      message: `Team chat is active with ${memberCount} members`,
      memberCount
    };

  } catch (error) {
    console.error(`❌ Error in ensureTeamChatActive for team ${teamId}:`, error);
    return {
      success: false,
      error: error.message,
      teamChat: null
    };
  }
};

/**
 * Joins all team members to the team chat socket room
 * 
 * @param {string} teamId - The team ID
 * @param {Array} teamMembers - Array of team member objects with _id
 * @param {object} io - Socket.io instance
 * @param {object} userSockets - User socket mapping
 * @param {string} teamName - Team name for notifications
 */
const joinAllMembersToTeamRoom = async (teamId, teamMembers, io, userSockets, teamName) => {
  if (!teamMembers || teamMembers.length === 0) return;
  
  const teamRoomId = `team_${teamId}`;
  console.log(`🔗 Joining ${teamMembers.length} members to team room: ${teamRoomId}`);
  
  let joinedCount = 0;
  let notifiedCount = 0;
  
  teamMembers.forEach(member => {
    const memberId = member._id.toString();
    const memberSocketId = userSockets[memberId];
    
    if (memberSocketId) {
      // Get the socket instance and join the room
      const memberSocket = io.sockets.sockets.get(memberSocketId);
      if (memberSocket) {
        memberSocket.join(teamRoomId);
        joinedCount++;
        
        // Notify member about team chat availability
        memberSocket.emit('teamChatAvailable', {
          teamId,
          teamName,
          message: `Team chat is now available for "${teamName}"!`,
          memberCount: teamMembers.length
        });
        notifiedCount++;
        
        console.log(`✅ Member ${member.name} joined team room ${teamRoomId}`);
      }
    } else {
      console.log(`⚠️ Member ${member.name} is not online, will join when they connect`);
    }
  });
  
  console.log(`✅ Team room management: ${joinedCount} joined, ${notifiedCount} notified`);
};

/**
 * Removes all team members from the team chat socket room
 * 
 * @param {string} teamId - The team ID
 * @param {Array} teamMembers - Array of team member objects with _id
 * @param {object} io - Socket.io instance
 * @param {object} userSockets - User socket mapping
 */
const removeAllMembersFromTeamRoom = async (teamId, teamMembers, io, userSockets) => {
  if (!teamMembers || teamMembers.length === 0) return;
  
  const teamRoomId = `team_${teamId}`;
  console.log(`🔌 Removing ${teamMembers.length} members from team room: ${teamRoomId}`);
  
  let removedCount = 0;
  
  teamMembers.forEach(member => {
    const memberId = member._id.toString();
    const memberSocketId = userSockets[memberId];
    
    if (memberSocketId) {
      const memberSocket = io.sockets.sockets.get(memberSocketId);
      if (memberSocket) {
        memberSocket.leave(teamRoomId);
        removedCount++;
        
        // Notify member about team chat deactivation
        memberSocket.emit('teamChatDeactivated', {
          teamId,
          message: 'Team chat has been deactivated (less than 2 members)'
        });
        
        console.log(`✅ Member ${member.name} removed from team room ${teamRoomId}`);
      }
    }
  });
  
  console.log(`✅ Removed ${removedCount} members from team room`);
};

/**
 * Handles when a single member joins a team
 * Checks if team chat should be activated and joins the member
 * 
 * @param {string} teamId - The team ID
 * @param {string} newMemberId - ID of the new member
 * @param {object} io - Socket.io instance (optional)
 * @param {object} userSockets - User socket mapping (optional)
 * @returns {object} Result object with team chat info
 */
const handleMemberJoinedTeam = async (teamId, newMemberId, io = null, userSockets = null) => {
  console.log(`=== TEAM CHAT MANAGER: Member ${newMemberId} joined team ${teamId} ===`);
  
  // First ensure team chat is active (this handles the 2+ member logic)
  const result = await ensureTeamChatActive(teamId, io, userSockets);
  
  if (!result.success) {
    return result;
  }
  
  // If team chat is active and member is online, ensure they're in the room
  if (result.teamChat && io && userSockets) {
    const memberSocketId = userSockets[newMemberId.toString()];
    if (memberSocketId) {
      const memberSocket = io.sockets.sockets.get(memberSocketId);
      if (memberSocket) {
        const teamRoomId = `team_${teamId}`;
        memberSocket.join(teamRoomId);
        
        // Get member info for notification
        const member = await User.findById(newMemberId).select('name');
        console.log(`✅ New member ${member?.name} joined team room ${teamRoomId}`);
        
        // Notify the new member specifically
        memberSocket.emit('teamChatJoined', {
          teamId,
          teamName: result.teamChat.team.name,
          message: `Welcome to the team chat!`,
          memberCount: result.memberCount
        });
      }
    }
  }
  
  return result;
};

/**
 * Handles when a member leaves a team
 * Removes them from socket room and checks if chat should be deactivated
 * 
 * @param {string} teamId - The team ID
 * @param {string} leavingMemberId - ID of the leaving member
 * @param {object} io - Socket.io instance (optional)
 * @param {object} userSockets - User socket mapping (optional)
 * @returns {object} Result object
 */
const handleMemberLeftTeam = async (teamId, leavingMemberId, io = null, userSockets = null) => {
  console.log(`=== TEAM CHAT MANAGER: Member ${leavingMemberId} left team ${teamId} ===`);
  
  // Remove member from socket room first
  if (io && userSockets) {
    const memberSocketId = userSockets[leavingMemberId.toString()];
    if (memberSocketId) {
      const memberSocket = io.sockets.sockets.get(memberSocketId);
      if (memberSocket) {
        const teamRoomId = `team_${teamId}`;
        memberSocket.leave(teamRoomId);
        
        memberSocket.emit('teamChatLeft', {
          teamId,
          message: 'You have left the team chat'
        });
        
        console.log(`✅ Member ${leavingMemberId} removed from team room ${teamRoomId}`);
      }
    }
  }
  
  // Check if team chat should be deactivated (this handles the < 2 member logic)
  const result = await ensureTeamChatActive(teamId, io, userSockets);
  
  return result;
};

module.exports = {
  ensureTeamChatActive,
  handleMemberJoinedTeam,
  handleMemberLeftTeam,
  joinAllMembersToTeamRoom,
  removeAllMembersFromTeamRoom
}; 