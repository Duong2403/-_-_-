const mongoose = require('mongoose');

const TeamChatSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.ObjectId,
    ref: 'Team',
    required: true,
    unique: true, // Each team can only have one team chat
    index: true, // Index for faster lookups
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  // Optional: Add settings for team chat
  settings: {
    allowAllMembers: {
      type: Boolean,
      default: true, // All team members can participate by default
    },
    // Future: could add moderation settings, notification preferences, etc.
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Ensure team chat is created only once per team
TeamChatSchema.index({ team: 1 }, { unique: true });

// Pre-save hook to set createdBy if not provided (fallback to team creator)
TeamChatSchema.pre('save', async function(next) {
  if (this.isNew && !this.createdBy) {
    try {
      const Team = mongoose.model('Team');
      const team = await Team.findById(this.team);
      if (team && team.createdBy) {
        this.createdBy = team.createdBy;
      }
    } catch (error) {
      console.error('Error setting createdBy for TeamChat:', error);
    }
  }
  next();
});

module.exports = mongoose.model('TeamChat', TeamChatSchema); 