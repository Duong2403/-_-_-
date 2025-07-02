const mongoose = require('mongoose');

const TimeSlotSchema = new mongoose.Schema({
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  // Optional: Add status per slot if multiple options are proposed
  // status: { type: String, enum: ['proposed', 'accepted', 'rejected'], default: 'proposed' }
}, { _id: false }); // Don't create separate IDs for time slots within the meeting doc

const MeetingSchema = new mongoose.Schema({
  match: { // The match this meeting belongs to
    type: mongoose.Schema.ObjectId,
    ref: 'Match',
    required: true,
    index: true,
  },
  proposer: { // User who proposed the meeting
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  proposedSlots: { // Array of proposed date/time slots
    type: [TimeSlotSchema],
    required: true,
    validate: [val => val.length > 0, 'At least one time slot must be proposed.']
  },
  location: { // Proposed location (can be text, e.g., "Online", "Library Cafe")
    type: String,
    trim: true,
    required: [true, 'Meeting location is required.']
  },
  description: { // Optional description/agenda
    type: String, 
    trim: true 
  },
  status: {
    type: String,
    enum: ['proposed', 'scheduled', 'cancelled', 'completed', 'reviewed'], // Meeting lifecycle
    default: 'proposed',
    required: true,
    index: true,
  },
  scheduledSlot: { // Store the finally agreed upon slot
    type: TimeSlotSchema,
    required: false // Only required when status is 'scheduled'
  },
  // Store responses to track agreement (optional, but useful)
  responses: [{
      userId: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
      // Indicate which slot index they prefer/accept, or -1 for reject all
      acceptedSlotIndex: { type: Number, required: true },
      status: { type: String, enum: ['accepted', 'rejected'], required: true }
  }]
}, {
  timestamps: true // Adds createdAt and updatedAt
});

module.exports = mongoose.model('Meeting', MeetingSchema);
