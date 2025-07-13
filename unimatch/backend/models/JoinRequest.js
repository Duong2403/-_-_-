const mongoose = require('mongoose');

const JoinRequestSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.ObjectId,
    ref: 'Team',
    required: [true, 'Team is required'],
  },
  applicant: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Applicant is required'],
  },
  message: {
    type: String,
    maxlength: [500, 'Message cannot be more than 500 characters'],
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'left'],
    default: 'pending',
  },
  reviewedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  reviewedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to prevent duplicate pending requests only
// This allows multiple requests from same user to same team if they are processed
JoinRequestSchema.index(
  { team: 1, applicant: 1, status: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { status: 'pending' } 
  }
);

module.exports = mongoose.model('JoinRequest', JoinRequestSchema); 