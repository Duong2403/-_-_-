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
      // Simplified check for .ac.kr or .edu ending only
      /\.(ac\.kr|edu)$/i,
      'Email must end with .ac.kr or .edu',
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
  
  // Phase 1 Enhanced Profile Fields
  
  // Academic Information
  major: {
    type: String,
    maxlength: [100, 'Major cannot be more than 100 characters'],
  },
  academicInterests: [{
    type: String,
    maxlength: [50, 'Academic interest cannot be more than 50 characters'],
  }],
  
  // MBTI & Personality
  mbti: {
    type: String,
    enum: ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 
           'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP', ''],
    default: '',
  },
  personalityTraits: [{
    type: String,
    maxlength: [30, 'Personality trait cannot be more than 30 characters'],
  }],
  
  // Interests & Hobbies
  hobbies: [{
    type: String,
    maxlength: [50, 'Hobby cannot be more than 50 characters'],
  }],
  musicGenres: [{
    type: String,
    maxlength: [30, 'Music genre cannot be more than 30 characters'],
  }],
  movieGenres: [{
    type: String,
    maxlength: [30, 'Movie genre cannot be more than 30 characters'],
  }],
  sports: [{
    type: String,
    maxlength: [30, 'Sport cannot be more than 30 characters'],
  }],
  
  // Friendship Goals
  friendshipGoals: [{
    type: String,
    maxlength: [50, 'Friendship goal cannot be more than 50 characters'],
  }],
  
  // Basic Lifestyle Preferences
  languages: [{
    type: String,
    maxlength: [30, 'Language cannot be more than 30 characters'],
  }],
  foodPreferences: [{
    type: String,
    maxlength: [30, 'Food preference cannot be more than 30 characters'],
  }],
  socialStyle: {
    type: String,
    enum: ['Social butterfly', 'Small groups', 'One-on-one', 'Flexible', ''],
    default: '',
  },
  
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
