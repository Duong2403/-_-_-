const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  requestingTeam: {
    type: mongoose.Schema.ObjectId,
    ref: 'Team',
    required: true,
    index: true, // Index for faster lookups
  },
  receivingTeam: {
    type: mongoose.Schema.ObjectId,
    ref: 'Team',
    required: true,
    index: true, // Index for faster lookups
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'], // Possible statuses
    default: 'pending',
    required: true,
    index: true,
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  respondedAt: {
    type: Date,
  },
  // Optional: Add a field for a chat room ID once chat is implemented
  // chatRoomId: {
  //   type: String,
  // }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Prevent duplicate pending requests between the same two teams
MatchSchema.index({ requestingTeam: 1, receivingTeam: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });
// Optional: Could also add an index to prevent accepted matches between same teams if needed

// Ensure a team cannot send a match request to itself
MatchSchema.pre('validate', function(next) {
  if (this.requestingTeam.equals(this.receivingTeam)) {
    next(new Error('A team cannot send a match request to itself.'));
  } else {
    next();
  }
});


module.exports = mongoose.model('Match', MatchSchema);
