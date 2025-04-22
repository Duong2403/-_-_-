const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Assuming User model is in ../models/User
const jwt = require('jsonwebtoken');

// Helper function to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token expires in 30 days
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res, next) => { // Added next
  const { name, email, password, age, university } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Validate age (redundant due to schema validation, but good practice)
    if (age < 19 || age > 29) {
        return res.status(400).json({ message: 'User must be between 19 and 29 years old' });
    }

    // Validate email domain (simplified check for ending only)
    const emailRegex = /\.(ac\.kr|edu)$/i; // Simpler check for ending only
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Email must end with .ac.kr or .edu' });
    }

    // Create new user instance (password hashing is handled by pre-save hook in User model)
    user = new User({
      name,
      email,
      password,
      age,
      university,
    });

    // Save user to database
    await user.save();

    // Generate token and respond
    const token = generateToken(user._id);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      university: user.university,
      token: token,
    });

  } catch (err) {
    console.error('Registration Error:', err.message);
    // Pass error to the error handling middleware
    next(err);
  }
});

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res, next) => { // Added next
  const { email, password } = req.body;

  try {
    // Check for user by email, explicitly selecting password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
      console.log(`User found: ${user.email}`); // Log if user is found
    }

    // Check if password matches
    console.log('Comparing entered password with stored hash...');
    const isMatch = await user.matchPassword(password);
    console.log(`Password match result: ${isMatch}`); // Log the result of comparison

    if (!isMatch) {
      console.log(`Password mismatch for user: ${user.email}`); // Log mismatch
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log(`Login successful for user: ${user.email}`); // Log success
    // Generate token and respond (don't send password back)
    const token = generateToken(user._id);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      university: user.university,
      token: token,
    });

  } catch (err) {
    // Pass error to the error handling middleware
    next(err);
  }
});

module.exports = router;
