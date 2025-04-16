const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http'); // Import http
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

// Define Routes
app.use('/api/auth', require('./routes/auth')); // Mount auth routes
app.use('/api/users', require('./routes/users')); // Mount user routes
app.use('/api/teams', require('./routes/teams')); // Mount team routes
app.use('/api/matches', require('./routes/matches')); // Mount match routes
app.use('/api/messages', require('./routes/messages')); // Mount message routes

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
    next();
  } catch (err) {
    console.error("Socket Auth Error:", err.message);
    next(new Error('Authentication error: Invalid token'));
  }
});


// Socket.IO Connection Handler (now assumes authenticated socket)
io.on('connection', (socket) => {
  // User is attached via the middleware above
  console.log(`Socket connected: ${socket.id}, User: ${socket.user.name} (${socket.user.email})`);

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}, User: ${socket.user.name}`);
  });

  // --- Chat Event Handlers ---

  // Join a chat room based on Match ID
  socket.on('joinRoom', (matchId) => {
    // TODO: Add validation - check if the user/team is actually part of this accepted match
    console.log(`User ${socket.user.name} joining room: ${matchId}`);
    socket.join(matchId);
    // Optionally send a confirmation or welcome message to the user
    // socket.emit('message', { text: `Welcome to chat for match ${matchId}` });
  });

  // Leave a chat room
   socket.on('leaveRoom', (matchId) => {
    console.log(`User ${socket.user.name} leaving room: ${matchId}`);
    socket.leave(matchId);
  });

  // Handle incoming chat messages
  socket.on('sendMessage', async (data) => { // Make the handler async
    const { matchId, text } = data;
    if (!matchId || !text) {
        // Handle error - maybe emit an error event back to sender
        console.error("sendMessage error: Missing matchId or text");
        return;
    }

    // TODO: Add validation - check if user is in the specified room (matchId)

    console.log(`Message received for room ${matchId} from ${socket.user.name}: ${text}`);

    // Construct message object
    const messageData = {
        sender: { // Send necessary sender info
            _id: socket.user._id,
            name: socket.user.name,
        },
        text: text,
        timestamp: new Date(),
            matchId: matchId // Include matchId for context if needed on client
    };

    // Save message to database
    try {
        const message = new Message({
            match: matchId,
            sender: socket.user._id,
            text: text,
        });
        await message.save();
        console.log(`Message saved to DB for match ${matchId}`);
    } catch (dbErr) {
        console.error(`Database save error for message in room ${matchId}:`, dbErr);
        // Decide if you want to emit an error back to the sender
        // socket.emit('error', { message: 'Failed to save message.' });
        // Or just log and continue broadcasting? For now, just log.
    }

    // Broadcast the message to all clients in the specific room (matchId)
    // including the sender
    io.to(matchId).emit('receiveMessage', messageData);

    // Or broadcast to everyone except the sender:
    // socket.to(matchId).emit('receiveMessage', messageData);
  });

});


// Start the server
server.listen(PORT, () => { // Listen on the http server
  console.log(`Server running on port ${PORT}`);
});
