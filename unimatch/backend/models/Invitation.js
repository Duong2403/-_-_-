const mongoose = require('mongoose');

const InvitationSchema = new mongoose.Schema({
  team: { // Team the invitation is for
    type: mongoose.Schema.ObjectId,
    ref: 'Team',
    required: true,
    index: true,
  },
  inviter: { // User who sent the invitation (usually team creator)
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  invitee: { // User being invited
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending',
    required: true,
    index: true,
  },
  // Optional: Add expiration date for invitations
  // expiresAt: {
  //   type: Date,
  //   // Example: expires in 7 days
  //   default: () => new Date(+new Date() + 7*24*60*60*1000),
  //   index: { expires: '1m' } // Automatically remove expired invites after 1 minute (adjust as needed)
  // }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Prevent duplicate pending invitations for the same user to the same team
InvitationSchema.index({ team: 1, invitee: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });

module.exports = mongoose.model('Invitation', InvitationSchema);
