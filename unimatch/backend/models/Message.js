const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  match: { // Reference to the Match this message belongs to
    type: mongoose.Schema.ObjectId,
    ref: 'Match',
    required: true,
    index: true,
  },
  sender: { // Reference to the User who sent the message
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  text: { // The content of the message
    type: String,
    required: [true, 'Message text cannot be empty.'],
    trim: true,
  },
  // Optional: Add read status if needed later
  // isRead: {
  //   type: Boolean,
  //   default: false,
  // }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

module.exports = mongoose.model('Message', MessageSchema);
