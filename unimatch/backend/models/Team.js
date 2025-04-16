const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a team name'],
    trim: true,
    maxlength: [50, 'Team name cannot be more than 50 characters'],
  },
  members: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
  ],
  university: {
    type: String,
    required: [true, 'University is required for a team'],
  },
  // Optional: Add a description or purpose for the team
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters'],
  },
  // Optional: Status field (e.g., 'forming', 'active', 'matched')
  status: {
    type: String,
    enum: ['forming', 'active', 'matched', 'inactive'],
    default: 'forming',
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure members array is not empty
TeamSchema.path('members').validate(function (value) {
  return value.length > 0;
}, 'Team must have at least one member.');

// Optional: Add a pre-save hook to ensure all members are from the same university
// This might be better handled in the route controller logic for clarity
// TeamSchema.pre('save', async function(next) {
//   const User = mongoose.model('User');
//   const members = await User.find({ _id: { $in: this.members } }).select('university');
//   if (members.length !== this.members.length) {
//     return next(new Error('One or more members not found.'));
//   }
//   const universities = new Set(members.map(m => m.university));
//   if (universities.size > 1) {
//     return next(new Error('All team members must be from the same university.'));
//   }
//   if (universities.values().next().value !== this.university) {
//      return next(new Error('Team university must match member universities.'));
//   }
//   next();
// });

module.exports = mongoose.model('Team', TeamSchema);
