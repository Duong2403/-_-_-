const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

// Load environment variables (ensure this runs if not already loaded globally)
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Use https
});

module.exports = cloudinary;
