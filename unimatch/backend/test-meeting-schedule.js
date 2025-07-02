const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Team = require('./models/Team');
const Match = require('./models/Match');
const Meeting = require('./models/Meeting');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

const testMeetingSchedule = async () => {
    console.log('=== Meeting Schedule Debug Test ===\n');

    try {
        // 1. Find users and teams
        const users = await User.find({}).select('name email');
        console.log('1. Available Users:');
        users.forEach(user => console.log(`   - ${user.name} (${user.email}) [ID: ${user._id}]`));
        console.log();

        // 2. Find teams
        const teams = await Team.find({}).populate('members', 'name email');
        console.log('2. Available Teams:');
        teams.forEach(team => {
            console.log(`   - ${team.name} [ID: ${team._id}]`);
            team.members.forEach(member => console.log(`     * ${member.name} (${member.email})`));
        });
        console.log();

        // 3. Find accepted matches
        const acceptedMatches = await Match.find({ status: 'accepted' })
            .populate('requestingTeam', 'name members')
            .populate('receivingTeam', 'name members');
        
        console.log('3. Accepted Matches:');
        acceptedMatches.forEach(match => {
            console.log(`   - Match ID: ${match._id}`);
            console.log(`     * Requesting Team: ${match.requestingTeam?.name} (${match.requestingTeam?.members?.length} members)`);
            console.log(`     * Receiving Team: ${match.receivingTeam?.name} (${match.receivingTeam?.members?.length} members)`);
        });
        console.log();

        // 4. Find existing meetings
        const existingMeetings = await Meeting.find({})
            .populate('proposer', 'name email')
            .populate('match', 'requestingTeam receivingTeam')
            .populate('responses.userId', 'name email');
        
        console.log('4. Existing Meetings:');
        if (existingMeetings.length === 0) {
            console.log('   - No meetings found');
        } else {
            existingMeetings.forEach(meeting => {
                console.log(`   - Meeting ID: ${meeting._id}`);
                console.log(`     * Status: ${meeting.status}`);
                console.log(`     * Proposer: ${meeting.proposer?.name}`);
                console.log(`     * Match: ${meeting.match?._id}`);
                console.log(`     * Location: ${meeting.location}`);
                console.log(`     * Description: ${meeting.description || 'None'}`);
                console.log(`     * Proposed Slots: ${meeting.proposedSlots?.length || 0}`);
                meeting.proposedSlots?.forEach((slot, index) => {
                    console.log(`       ${index}: ${new Date(slot.startTime).toLocaleString()} - ${new Date(slot.endTime).toLocaleString()}`);
                });
                console.log(`     * Responses: ${meeting.responses?.length || 0}`);
                meeting.responses?.forEach(response => {
                    console.log(`       - ${response.userId?.name}: ${response.status} (slot ${response.acceptedSlotIndex})`);
                });
                if (meeting.scheduledSlot) {
                    console.log(`     * Scheduled: ${new Date(meeting.scheduledSlot.startTime).toLocaleString()} - ${new Date(meeting.scheduledSlot.endTime).toLocaleString()}`);
                }
                console.log();
            });
        }

        // 5. Test creating a meeting proposal if we have data
        if (acceptedMatches.length > 0 && users.length > 0) {
            const testMatch = acceptedMatches[0];
            const testUser = users[0];
            
            console.log('5. Testing Meeting Creation:');
            console.log(`   - Using Match: ${testMatch._id}`);
            console.log(`   - Using Proposer: ${testUser.name} (${testUser._id})`);
            
            // Check if user is actually in the match
            const allMemberIds = [
                ...(testMatch.requestingTeam?.members || []),
                ...(testMatch.receivingTeam?.members || [])
            ].map(id => id.toString());
            
            const isUserInMatch = allMemberIds.includes(testUser._id.toString());
            console.log(`   - Is user in match? ${isUserInMatch}`);
            
            if (isUserInMatch) {
                // Create test time slots for tomorrow
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(14, 0, 0, 0); // 2 PM
                
                const endTime = new Date(tomorrow);
                endTime.setHours(15, 0, 0, 0); // 3 PM
                
                const testMeeting = {
                    match: testMatch._id,
                    proposer: testUser._id,
                    proposedSlots: [
                        {
                            startTime: tomorrow,
                            endTime: endTime
                        }
                    ],
                    location: 'Test Library Room',
                    description: 'Test meeting proposal',
                    status: 'proposed'
                };
                
                console.log('   - Test meeting data:', JSON.stringify(testMeeting, null, 2));
                
                // Check for existing meetings for this match
                const existingForMatch = await Meeting.findOne({ 
                    match: testMatch._id, 
                    status: { $in: ['proposed', 'scheduled'] } 
                });
                
                if (existingForMatch) {
                    console.log(`   - Cannot create test meeting: existing ${existingForMatch.status} meeting found`);
                } else {
                    console.log('   - No existing meetings found, could create test meeting');
                }
            } else {
                console.log('   - Cannot test: user is not part of the match');
            }
        } else {
            console.log('5. Cannot test meeting creation: no accepted matches or users found');
        }

    } catch (error) {
        console.error('Error during meeting schedule test:', error);
    }
};

const main = async () => {
    await connectDB();
    await testMeetingSchedule();
    process.exit(0);
};

main(); 