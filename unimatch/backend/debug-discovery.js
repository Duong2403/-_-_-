require('dotenv').config();
const mongoose = require('mongoose');
const Team = require('./models/Team');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('=== TEAM DISCOVERY DEBUG ===\n');
  
  // Get all users
  const users = await User.find({}).select('name email university');
  console.log('1. ALL USERS:');
  users.forEach(user => {
    console.log(`   - ${user.name} (${user.email}) - University: "${user.university}"`);
  });
  console.log('');
  
  // Get all teams
  const teams = await Team.find({}).select('name university status members');
  console.log('2. ALL TEAMS (without population):');
  teams.forEach(team => {
    console.log(`   - ${team.name} - University: "${team.university}" - Status: ${team.status} - Members: ${team.members.length}`);
  });
  console.log('');
  
  // Test discovery logic for each user
  console.log('3. DISCOVERY SIMULATION:');
  for (const user of users) {
    console.log(`\nFor user "${user.name}" (university: "${user.university}"):`);
    
    // Simulate the discovery query
    const discoveryTeams = await Team.find({
      university: user.university,
      members: { $ne: user._id },
      status: { $in: ['active', 'matched'] }
    }).select('name university status members');
    
    console.log(`   Discovery query found ${discoveryTeams.length} teams:`);
    discoveryTeams.forEach(team => {
      console.log(`     - ${team.name} (${team.university}) - ${team.status}`);
    });
    
    if (discoveryTeams.length === 0) {
      console.log(`     ❌ No teams found for ${user.name}`);
      
      // Debug why no teams found
      const sameUniversityTeams = await Team.find({
        university: user.university
      }).select('name university status members');
      
      console.log(`     Debug: Teams from same university "${user.university}":`);
      sameUniversityTeams.forEach(team => {
        const isUserMember = team.members.some(memberId => memberId.equals(user._id));
        const statusOk = ['active', 'matched'].includes(team.status);
        console.log(`       - ${team.name}: status=${team.status} (${statusOk ? 'OK' : 'FILTERED'}), user_is_member=${isUserMember} (${isUserMember ? 'FILTERED' : 'OK'})`);
      });
    }
  }
  
  process.exit(0);
}).catch(err => {
  console.error('Connection failed:', err.message);
  process.exit(1);
}); 