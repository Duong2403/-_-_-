const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      // Basic email format validation + common university domains (adjust as needed)
      /^\w+([\.-]?\w+)*@(?:ac\.kr|edu)$/, // Example: Allows .ac.kr and .edu domains
      'Please add a valid university email address (.ac.kr or .edu)',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false, // Do not return password by default
  },
  age: {
    type: Number,
    required: [true, 'Please add an age'],
    min: [19, 'Age must be at least 19'],
    max: [29, 'Age must be no more than 29'],
  },
  university: {
    type: String,
    required: [true, 'Please add your university'],
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters'],
  },
  photos: [
    {
      url: String, // URL from image hosting service (e.g., Cloudinary)
      public_id: String, // ID from image hosting service
      isVerified: { type: Boolean, default: false }, // Status from photo verification API
    },
  ],
  // Add other profile fields as needed (e.g., major, interests)
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt before saving
UserSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) {
    return next();
  }

  // Hash the password with cost of 12
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
