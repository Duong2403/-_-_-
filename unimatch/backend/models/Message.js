const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  match: { // Reference to the Match this message belongs to (for inter-team chats)
    type: mongoose.Schema.ObjectId,
    ref: 'Match',
    required: function() { return !this.teamChat; }, // Required only if teamChat is not provided
    index: true,
  },
  teamChat: { // Reference to the TeamChat this message belongs to (for intra-team chats)
    type: mongoose.Schema.ObjectId,
    ref: 'TeamChat',
    required: function() { return !this.match; }, // Required only if match is not provided
    index: true,
  },
  sender: { // Reference to the User who sent the message
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  messageType: { // Type of message: 'text', 'image', 'emoji'
    type: String,
    enum: ['text', 'image', 'emoji'],
    default: 'text',
  },
  text: { // The content of the message
    type: String,
    required: function() { 
      return this.messageType === 'text' || this.messageType === 'emoji'; 
    },
    trim: true,
  },
  attachment: { // For image messages
    url: {
      type: String,
      required: function() { return this.messageType === 'image'; }
    },
    publicId: {
      type: String,
      required: function() { return this.messageType === 'image'; }
    },
    filename: {
      type: String,
      required: function() { return this.messageType === 'image'; }
    },
    size: {
      type: Number,
      required: function() { return this.messageType === 'image'; }
    },
    width: Number,
    height: Number,
  },
  isPrivate: { // Flag for private messages (only applicable to match-based chats)
    type: Boolean,
    default: false,
    validate: {
      validator: function(value) {
        // Private messages are only allowed in match-based chats, not team chats
        if (value && this.teamChat) {
          return false;
        }
        return true;
      },
      message: 'Private messages are not supported in team chats'
    }
  },
  recipient: { // Reference to the specific recipient User for private messages
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: function() { return this.isPrivate; }, // Required only if isPrivate is true
    index: true, // Index recipient for faster private chat lookups
  },
  // Optional: Add read status if needed later
  // isRead: {
  //   type: Boolean,
  //   default: false,
  // }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Validation: Ensure exactly one of match or teamChat is provided
MessageSchema.pre('validate', function(next) {
  const hasMatch = !!this.match;
  const hasTeamChat = !!this.teamChat;
  
  if (!hasMatch && !hasTeamChat) {
    return next(new Error('Message must belong to either a match or team chat'));
  }
  
  if (hasMatch && hasTeamChat) {
    return next(new Error('Message cannot belong to both a match and team chat'));
  }
  
  next();
});

// Helper method to determine message context type
MessageSchema.methods.getContextType = function() {
  if (this.match) return 'match';
  if (this.teamChat) return 'teamChat';
  return null;
};

// Helper method to get context ID
MessageSchema.methods.getContextId = function() {
  if (this.match) return this.match;
  if (this.teamChat) return this.teamChat;
  return null;
};

module.exports = mongoose.model('Message', MessageSchema);
