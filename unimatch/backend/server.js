const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http'); // Import http
const path = require('path'); // Import path for static files
const { Server } = require("socket.io"); // Import Server from socket.io
const jwt = require('jsonwebtoken'); // Require JWT for socket auth
const User = require('./models/User'); // Require User model for socket auth
const Message = require('./models/Message'); // Require Message model

// Load environment variables from .env file
dotenv.config();

// Database connection function
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    // Exit process with failure
    process.exit(1);
  }
};

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Define Routes
app.use('/api/auth', require('./routes/auth')); // Mount auth routes
app.use('/api/users', require('./routes/users')); // Mount user routes
app.use('/api/teams', require('./routes/teams')); // Mount team routes
app.use('/api/matches', require('./routes/matches')); // Mount match routes
app.use('/api/messages', require('./routes/messages')); // Mount message routes
app.use('/api/team-chats', require('./routes/teamChats')); // Mount team chat routes
app.use('/api/invitations', require('./routes/invitations')); // Mount invitation routes
app.use('/api/meetings', require('./routes/meetings')); // Mount meeting routes
app.use('/api/reviews', require('./routes/reviews')); // Mount review routes
app.use('/api/join-requests', require('./routes/joinRequests')); // Mount join request routes

// Basic route for testing (can be removed later)
app.get('/', (req, res) => {
  res.send('UniMatch Backend API is running...');
});

// --- Error Handling Middleware ---
// Import error handlers
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// 404 Not Found handler (if no route matched above)
app.use(notFound);

// General error handler (must be last)
app.use(errorHandler);


// Define the port
const PORT = process.env.PORT || 5000; // Use port from .env or default to 5000

// Create HTTP server and integrate Socket.IO
const server = http.createServer(app); // Create server from Express app
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Allow frontend origin (adjust port if different)
    methods: ["GET", "POST"]
  }
});

// Make io accessible to routes AFTER it's initialized
app.set('socketio', io);

// In-memory store for user ID to socket ID mapping
const userSockets = {};
// Make userSockets accessible to routes
app.set('userSockets', userSockets);

// Socket.IO Authentication Middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token; // Expect token from client handshake auth
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user to the socket object (excluding password)
    socket.user = await User.findById(decoded.id).select('-password');
    if (!socket.user) {
         return next(new Error('Authentication error: User not found'));
    }
    // Store the mapping
    userSockets[socket.user._id.toString()] = socket.id;
    console.log('User sockets map updated:', userSockets);
    next();
  } catch (err) {
    console.error("Socket Auth Error:", err.message);
    next(new Error('Authentication error: Invalid token'));
  }
});


// Socket.IO Connection Handler (now assumes authenticated socket)
io.on('connection', async (socket) => {
  // User is attached via the middleware above
  console.log(`Socket connected: ${socket.id}, User: ${socket.user.name} (${socket.user.email})`);

  // Auto-join user to their team chat rooms when they connect
  try {
    const Team = require('./models/Team');
    const TeamChat = require('./models/TeamChat');
    
    // Find all teams the user is a member of
    const userTeams = await Team.find({ 
      members: socket.user._id, 
      status: { $in: ['active', 'matched'] } 
    }).select('_id name');
    
    if (userTeams.length > 0) {
      console.log(`Auto-joining user ${socket.user.name} to ${userTeams.length} team chat rooms`);
      
      for (const team of userTeams) {
        // Check if team has an active team chat
        const teamChat = await TeamChat.findOne({ 
          team: team._id, 
          isActive: true 
        });
        
        if (teamChat) {
          const teamRoomId = `team_${team._id}`;
          socket.join(teamRoomId);
          console.log(`✅ User ${socket.user.name} auto-joined team room: ${teamRoomId} (${team.name})`);
          
          // Notify user about available team chat
          socket.emit('teamChatAutoJoined', {
            teamId: team._id.toString(),
            teamName: team.name,
            message: `Connected to team chat for "${team.name}"`
          });
        }
      }
    }
  } catch (autoJoinError) {
    console.error('❌ Error auto-joining user to team chats:', autoJoinError);
    // Don't fail the connection if auto-join fails
  }

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}, User: ${socket.user.name}`);
    // Remove user from mapping on disconnect
    const userId = Object.keys(userSockets).find(key => userSockets[key] === socket.id);
    if (userId) {
        delete userSockets[userId];
        console.log('User sockets map updated after disconnect:', userSockets);
    }
  });

  // --- Chat Event Handlers ---

  // Join a chat room based on Match ID (existing functionality)
  socket.on('joinRoom', (matchId) => {
    // TODO: Add validation - check if the user/team is actually part of this accepted match
    console.log(`User ${socket.user.name} joining match room: ${matchId}`);
    socket.join(matchId);
    // Optionally send a confirmation or welcome message to the user
    // socket.emit('message', { text: `Welcome to chat for match ${matchId}` });
  });

  // Leave a chat room (existing functionality)
   socket.on('leaveRoom', (matchId) => {
    console.log(`User ${socket.user.name} leaving match room: ${matchId}`);
    socket.leave(matchId);
  });

  // Join a team chat room based on Team ID (new functionality)
  socket.on('joinTeamRoom', async (teamId) => {
    try {
      // Validate that user is a member of this team
      const Team = require('./models/Team');
      const team = await Team.findById(teamId);
      
      if (!team) {
        socket.emit('teamChatError', { message: 'Team not found' });
        return;
      }
      
      const isTeamMember = team.members.some(memberId => 
        memberId.equals ? memberId.equals(socket.user._id) : memberId.toString() === socket.user._id.toString()
      );
      
      if (!isTeamMember) {
        socket.emit('teamChatError', { message: 'You are not a member of this team' });
        return;
      }
      
      const teamRoomId = `team_${teamId}`;
      console.log(`User ${socket.user.name} joining team room: ${teamRoomId}`);
      socket.join(teamRoomId);
      
      // Send confirmation
      socket.emit('teamRoomJoined', { teamId, teamName: team.name });
      
    } catch (err) {
      console.error('Error joining team room:', err);
      socket.emit('teamChatError', { message: 'Failed to join team chat' });
    }
  });

  // Leave a team chat room (new functionality)
  socket.on('leaveTeamRoom', (teamId) => {
    const teamRoomId = `team_${teamId}`;
    console.log(`User ${socket.user.name} leaving team room: ${teamRoomId}`);
    socket.leave(teamRoomId);
    socket.emit('teamRoomLeft', { teamId });
  });

  // Handle incoming chat messages (group or private)
  socket.on('sendMessage', async (data) => { // Make the handler async
    const { matchId, text, recipientId, isPrivate } = data; // Add recipientId and isPrivate

    if (!matchId || !text) {
        console.error("sendMessage error: Missing matchId or text");
        socket.emit('messageError', { message: 'Missing required message data.' });
        return;
    }
    if (isPrivate && !recipientId) {
        console.error("sendMessage error: Missing recipientId for private message");
        socket.emit('messageError', { message: 'Recipient ID is required for private messages.' });
        return;
    }

    // TODO: Add validation - check if user is part of the matchId

    console.log(`Message received: ${isPrivate ? 'Private' : 'Group'} for match ${matchId} from ${socket.user.name}: ${text}`);

    // Construct message object to save
    const messageToSave = new Message({
        match: matchId,
        sender: socket.user._id,
        text: text,
        messageType: 'text', // Default message type
        isPrivate: !!isPrivate, // Ensure boolean
        recipient: isPrivate ? recipientId : undefined,
    });

    // Save message to database first
    try {
        const savedMessage = await messageToSave.save();
        console.log(`Message saved to DB (ID: ${savedMessage._id}) for match ${matchId}`);
        
        // Construct message object to emit (include recipient for private messages)
        const messageToEmit = {
            _id: savedMessage._id, // Use actual saved ID
            sender: { _id: socket.user._id, name: socket.user.name },
            text: text,
            messageType: 'text',
            timestamp: savedMessage.createdAt, // Use actual timestamp from DB
            matchId: matchId,
            isPrivate: !!isPrivate,
            recipient: isPrivate ? { _id: recipientId } : undefined, // Include recipient ID if private
            createdAt: savedMessage.createdAt // Add createdAt for consistency
        };

        if (isPrivate) {
            // Send to recipient if online
            const recipientSocketId = userSockets[recipientId.toString()];
            console.log(`Looking for recipient ${recipientId} in userSockets:`, userSockets);
            
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('receiveMessage', messageToEmit);
                console.log(`Private message ${savedMessage._id} sent to recipient ${recipientId} (socket ${recipientSocketId})`);
            } else {
                console.log(`Recipient ${recipientId} is offline or not found in userSockets. Message saved for later.`);
                // Optionally implement offline message handling/notifications later
            }
            
            // Always send back to sender for confirmation/display
            socket.emit('receiveMessage', messageToEmit);
            console.log(`Private message ${savedMessage._id} sent back to sender ${socket.user.name} (socket ${socket.id})`);

        } else {
            // Broadcast the group message to all clients in the specific room (matchId)
            io.to(matchId).emit('receiveMessage', messageToEmit);
            console.log(`Group message ${savedMessage._id} broadcast to room ${matchId}`);
        }

    } catch (dbErr) {
        console.error(`Database save error for message in match ${matchId}:`, dbErr);
        socket.emit('messageError', { message: 'Failed to save or send message.' });
    }
  });

  // Handle incoming team chat messages (new functionality)
  socket.on('sendTeamMessage', async (data) => {
    const { teamId, text } = data;

    if (!teamId || !text) {
        console.error("sendTeamMessage error: Missing teamId or text");
        socket.emit('teamChatError', { message: 'Missing required message data.' });
        return;
    }

    try {
        // Validate that user is a member of this team
        const Team = require('./models/Team');
        const TeamChat = require('./models/TeamChat');
        
        const team = await Team.findById(teamId);
        if (!team) {
            socket.emit('teamChatError', { message: 'Team not found.' });
            return;
        }
        
        const isTeamMember = team.members.some(memberId => 
            memberId.equals ? memberId.equals(socket.user._id) : memberId.toString() === socket.user._id.toString()
        );
        
        if (!isTeamMember) {
            socket.emit('teamChatError', { message: 'You are not a member of this team.' });
            return;
        }

        console.log(`Team message received for team ${teamId} from ${socket.user.name}: ${text}`);

        // Find or create team chat
        let teamChat = await TeamChat.findOne({ team: teamId });
        if (!teamChat) {
            teamChat = new TeamChat({
                team: teamId,
                createdBy: team.createdBy,
                isActive: true
            });
            await teamChat.save();
            console.log(`Created new team chat for team ${teamId}`);
        }

        // Construct message object to save
        const messageToSave = new Message({
            teamChat: teamChat._id,
            sender: socket.user._id,
            text: text,
            messageType: 'text',
            isPrivate: false // Team chat messages are always public within the team
        });

        // Save message to database
        const savedMessage = await messageToSave.save();
        console.log(`Team message saved to DB (ID: ${savedMessage._id}) for team ${teamId}`);
        
        // Construct message object to emit
        const messageToEmit = {
            _id: savedMessage._id,
            sender: { _id: socket.user._id, name: socket.user.name },
            text: text,
            messageType: 'text',
            timestamp: savedMessage.createdAt,
            teamId: teamId,
            createdAt: savedMessage.createdAt
        };

        // Broadcast the message to all clients in the team room
        const teamRoomId = `team_${teamId}`;
        io.to(teamRoomId).emit('receiveTeamMessage', messageToEmit);
        console.log(`Team message ${savedMessage._id} broadcast to room ${teamRoomId}`);

    } catch (dbErr) {
        console.error(`Database save error for team message in team ${teamId}:`, dbErr);
        socket.emit('teamChatError', { message: 'Failed to save or send message.' });
    }
  });

  // --- Meeting Event Handlers (Example - Adapt as needed) ---
  // Listen for meeting proposals/updates from routes and broadcast
  // This requires the route handlers to access 'io' via app.get('socketio')

});


// Start the server
server.listen(PORT, () => { // Listen on the http server
  console.log(`Server running on port ${PORT}`);
});
