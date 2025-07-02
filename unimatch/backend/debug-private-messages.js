const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Message = require('./models/Message');
const User = require('./models/User');
const Match = require('./models/Match');
const Team = require('./models/Team');

// Load environment variables
dotenv.config();

async function debugPrivateMessages() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB for debugging...\n');

        // 1. Check all users
        const users = await User.find().select('name email');
        console.log('=== ALL USERS ===');
        users.forEach(user => {
            console.log(`ID: ${user._id}, Name: ${user.name}, Email: ${user.email}`);
        });
        console.log('');

        // 2. Check all teams and their members
        const teams = await Team.find().populate('members', 'name email');
        console.log('=== ALL TEAMS ===');
        teams.forEach(team => {
            console.log(`Team: ${team.name}`);
            team.members.forEach(member => {
                console.log(`  - ${member.name} (${member._id})`);
            });
        });
        console.log('');

        // 3. Check accepted matches
        const matches = await Match.find({ status: 'accepted' })
            .populate({
                path: 'requestingTeam',
                populate: { path: 'members', select: 'name' }
            })
            .populate({
                path: 'receivingTeam',
                populate: { path: 'members', select: 'name' }
            });
        
        console.log('=== ACCEPTED MATCHES ===');
        matches.forEach(match => {
            console.log(`Match ID: ${match._id}`);
            console.log(`  Requesting Team: ${match.requestingTeam?.name}`);
            match.requestingTeam?.members?.forEach(member => {
                console.log(`    - ${member.name} (${member._id})`);
            });
            console.log(`  Receiving Team: ${match.receivingTeam?.name}`);
            match.receivingTeam?.members?.forEach(member => {
                console.log(`    - ${member.name} (${member._id})`);
            });
            console.log('');
        });

        // 4. Check all messages (both group and private)
        const allMessages = await Message.find()
            .populate('sender', 'name')
            .populate('recipient', 'name')
            .sort({ createdAt: -1 })
            .limit(20);
        
        console.log('=== RECENT MESSAGES (Last 20) ===');
        allMessages.forEach(msg => {
            const type = msg.isPrivate ? 'PRIVATE' : 'GROUP';
            const recipient = msg.recipient ? ` -> ${msg.recipient.name}` : '';
            console.log(`[${type}] ${msg.sender.name}${recipient}: "${msg.text}" (Match: ${msg.match})`);
            console.log(`  Created: ${msg.createdAt}, ID: ${msg._id}`);
        });
        console.log('');

        // 5. Check private messages specifically
        const privateMessages = await Message.find({ isPrivate: true })
            .populate('sender', 'name')
            .populate('recipient', 'name')
            .sort({ createdAt: -1 });
        
        console.log('=== ALL PRIVATE MESSAGES ===');
        if (privateMessages.length === 0) {
            console.log('No private messages found.');
        } else {
            privateMessages.forEach(msg => {
                console.log(`${msg.sender.name} -> ${msg.recipient?.name}: "${msg.text}"`);
                console.log(`  Match: ${msg.match}, Created: ${msg.createdAt}`);
            });
        }
        console.log('');

        // 6. Test private message query for specific users (if available)
        if (users.length >= 2) {
            const user1 = users[0]._id;
            const user2 = users[1]._id;
            
            console.log(`=== TESTING PRIVATE MESSAGE QUERY ===`);
            console.log(`Testing between ${users[0].name} (${user1}) and ${users[1].name} (${user2})`);
            
            const testQuery = await Message.find({
                isPrivate: true,
                $or: [
                    { sender: user1, recipient: user2 },
                    { sender: user2, recipient: user1 }
                ]
            }).populate('sender', 'name').populate('recipient', 'name');
            
            console.log(`Found ${testQuery.length} private messages between these users:`);
            testQuery.forEach(msg => {
                console.log(`  ${msg.sender.name} -> ${msg.recipient?.name}: "${msg.text}"`);
            });
        }

    } catch (error) {
        console.error('Debug error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB.');
    }
}

// Run the debug function
debugPrivateMessages(); 