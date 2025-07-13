require('dotenv').config();
const mongoose = require('mongoose');
const Team = require('./models/Team');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('=== FIXING MEMBER ID MISMATCHES ===\n');
  
  const teams = await Team.find({});
  const users = await User.find({});
  
  console.log('Current users:');
  users.forEach(user => {
    console.log(`  - ${user.name} (${user._id}) - ${user.university}`);
  });
  
  console.log('\nFixing teams:');
  
  // Fix each team by matching names
  const fixes = [
    { teamName: 'Duong Nguyen', userName: 'Duong Nguyen' },
    { teamName: 'duong', userName: 'Duong Nguyen' },
    { teamName: '매추리', userName: 'dung' },
    { teamName: '2', userName: 'Duong Nguyen' },
    { teamName: 'anh', userName: 'anh' }
  ];
  
  for (const fix of fixes) {
    const team = teams.find(t => t.name === fix.teamName);
    const user = users.find(u => u.name === fix.userName);
    
    if (team && user) {
      console.log(`Fixing team "${fix.teamName}" -> user "${fix.userName}" (${user._id})`);
      team.members = [user._id];
      team.createdBy = user._id;
      await team.save();
    } else {
      console.log(`Could not fix: ${fix.teamName} (team found: ${!!team}, user found: ${!!user})`);
    }
  }
  
  console.log('\n=== TESTING DISCOVERY ===\n');
  
  // Test discovery for each user
  for (const user of users) {
    console.log(`Testing discovery for "${user.name}" (university: "${user.university}"):`);
    
    const discoveryTeams = await Team.find({
      university: user.university,
      members: { $ne: user._id },
      status: { $in: ['active', 'matched'] }
    });
    
    console.log(`  Found ${discoveryTeams.length} discoverable teams:`);
    discoveryTeams.forEach(team => {
      console.log(`    - ${team.name}`);
    });
    console.log('');
  }
  
  console.log('=== SUMMARY ===');
  const finalTeams = await Team.find({}).populate('members', 'name email university');
  finalTeams.forEach(team => {
    console.log(`Team: ${team.name} (${team.university})`);
    team.members.forEach(member => {
      console.log(`  Member: ${member.name} (${member.university})`);
    });
  });
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
}); 