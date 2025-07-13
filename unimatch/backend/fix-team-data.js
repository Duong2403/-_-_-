require('dotenv').config();
const mongoose = require('mongoose');
const Team = require('./models/Team');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('=== FIXING TEAM DATA ISSUES ===\n');
  
  // Get all teams and users
  const teams = await Team.find({});
  const users = await User.find({});
  
  console.log('1. FIXING EMPTY MEMBER ARRAYS:');
  
  for (const team of teams) {
    console.log(`Checking team: ${team.name}`);
    
    // Check if team has no members but has a creator
    if (team.members.length === 0 && team.createdBy) {
      console.log(`  - Adding creator to members array`);
      team.members.push(team.createdBy);
      await team.save();
    }
    
    // Check if team has empty members but creator exists in database
    if (team.members.length === 0) {
      // Try to find user by matching name (fallback)
      const possibleCreator = users.find(user => 
        user.name.toLowerCase().includes(team.name.toLowerCase()) ||
        team.name.toLowerCase().includes(user.name.toLowerCase())
      );
      
      if (possibleCreator) {
        console.log(`  - Found potential creator: ${possibleCreator.name}, adding to team`);
        team.members.push(possibleCreator._id);
        team.createdBy = possibleCreator._id;
        await team.save();
      }
    }
  }
  
  console.log('\n2. FIXING UNIVERSITY MISMATCHES:');
  
  // Fix "seoul university" to "seoul" 
  const seoulUnivTeam = await Team.findOne({ university: 'seoul university' });
  if (seoulUnivTeam) {
    console.log(`  - Changing "${seoulUnivTeam.name}" university from "seoul university" to "seoul"`);
    seoulUnivTeam.university = 'seoul';
    await seoulUnivTeam.save();
  }
  
  console.log('\n3. ENSURING ALL TEAMS ARE ACTIVE:');
  await Team.updateMany({ status: 'forming' }, { status: 'active' });
  
  console.log('\n4. VERIFICATION - Final state:');
  const finalTeams = await Team.find({}).populate('members', 'name email university');
  finalTeams.forEach(team => {
    console.log(`Team: ${team.name}`);
    console.log(`  University: "${team.university}"`);
    console.log(`  Status: ${team.status}`);
    console.log(`  Members: ${team.members.length}`);
    team.members.forEach(member => {
      console.log(`    - ${member.name} (${member.university})`);
    });
    console.log('');
  });
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
}); 