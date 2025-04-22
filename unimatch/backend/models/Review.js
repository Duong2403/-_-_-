const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  match: { // The match context for this review
    type: mongoose.Schema.ObjectId,
    ref: 'Match',
    required: true,
    index: true,
  },
  reviewer: { // The user submitting the review
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  reviewingTeam: { // The team the reviewer belongs to in this match
    type: mongoose.Schema.ObjectId,
    ref: 'Team',
    required: true,
  },
  reviewedTeam: { // The team being reviewed
    type: mongoose.Schema.ObjectId,
    ref: 'Team',
    required: true,
    index: true,
  },
  teamRating: { // Overall rating for the reviewed team
    type: Number,
    min: 1,
    max: 5,
    required: [true, 'Please provide a rating for the team (1-5 stars).'],
  },
  memberRatings: [ // Optional: Ratings for individual members of the reviewed team
    {
      _id: false, // Don't need separate IDs for subdocuments here
      userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
      },
      rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      }
    }
  ],
  comment: { // Public comment about the interaction/team
    type: String,
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters.'],
    // required: [true, 'Please provide a comment.'] // Make optional?
  },
  // Optional: Add tags like "punctual", "friendly", etc.
  // tags: [String],
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Prevent a user from submitting more than one review per match for the same opponent team
ReviewSchema.index({ match: 1, reviewer: 1, reviewedTeam: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
