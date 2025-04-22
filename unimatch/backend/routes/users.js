const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinaryConfig'); // Import configured Cloudinary instance
const User = require('../models/User'); // Adjust path as necessary
const { protect } = require('../middleware/authMiddleware'); // Import protect middleware

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size (e.g., 5MB)
    fileFilter: function (req, file, cb) {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image file.'), false);
        }
    }
});


// @desc    Get logged-in user's profile
// @route   GET /api/users/me
// @access  Private
router.get('/me', protect, async (req, res, next) => { // Added next
  try {
    // req.user is attached by the protect middleware
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user profile data (excluding password)
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      university: user.university,
      bio: user.bio,
      photos: user.photos,
      createdAt: user.createdAt,
    });
  } catch (err) {
    next(err); // Pass error to middleware
  }
});

// @desc    Update logged-in user's profile
// @route   PUT /api/users/me
// @access  Private
router.put('/me', protect, async (req, res, next) => { // Added next
  const { name, bio, /* other updatable fields */ } = req.body;
  const userId = req.user.id;

  try {
    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if they are provided in the request body
    if (name) user.name = name;
    if (bio) user.bio = bio;
    // Add other fields here...
    // Note: Email, age, university, password changes might need separate, more secure routes/logic

    const updatedUser = await user.save();

    // Return updated user profile data
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      age: updatedUser.age,
      university: updatedUser.university,
      bio: updatedUser.bio,
      photos: updatedUser.photos,
      createdAt: updatedUser.createdAt,
    });

  } catch (err) {
    console.error('Update User Profile Error:', err.message);
    next(err); // Pass error to middleware (Validation errors will be handled by errorHandler)
  }
});

// @desc    Upload a photo for user profile
// @route   POST /api/users/me/photos
// @access  Private
router.post('/me/photos', protect, upload.single('photo'), async (req, res, next) => { // Added next
    // 'photo' is the field name expected in the form-data
    const userId = req.user.id;

    if (!req.file) {
        return res.status(400).json({ message: 'Please upload a photo file' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Upload image buffer to Cloudinary using a stream
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `unimatch/user_photos/${userId}`, // Optional: Organize uploads in folders
                // transformation: [{ width: 500, height: 500, crop: "limit" }] // Optional: Resize image
            },
            async (error, result) => {
                if (error) {
                    console.error('Cloudinary Upload Error:', error);
                    return res.status(500).json({ message: 'Error uploading photo to cloud storage' });
                }

                // Add photo info to user's photos array
                const newPhoto = {
                    url: result.secure_url,
                    public_id: result.public_id,
                    isVerified: false, // Set verification status later if needed
                };

                // Limit the number of photos if desired (e.g., max 5 photos)
                // if (user.photos.length >= 5) {
                //     // Optionally remove the oldest photo before adding new one
                //     // Or just return an error
                //     return res.status(400).json({ message: 'Maximum number of photos reached' });
                // }

                user.photos.push(newPhoto);
                await user.save();

                // Return the updated user profile (or just the new photo info)
                res.status(201).json(newPhoto);
            }
        );

        // Pipe the buffer from multer into the Cloudinary upload stream
        uploadStream.end(req.file.buffer);

    } catch (err) {
        next(err); // Pass error to middleware
    }
}, (error, req, res, next) => { // This is Multer's error handler
    // Handle Multer errors (e.g., file size limit) - pass to general handler
    res.status(400).json({ message: error.message });
});

// @desc    Search for users by name/email within a specific university
// @route   GET /api/users/search?q=searchText&university=uniName
// @access  Private
router.get('/search', protect, async (req, res, next) => {
    const searchQuery = req.query.q || '';
    const university = req.query.university || '';
    const currentUserId = req.user.id; // Don't include the logged-in user in search results

    if (!university) {
        return res.status(400).json({ message: 'University parameter is required for search.' });
    }
    if (!searchQuery) {
         return res.json([]); // Return empty if search query is empty
    }

    try {
        // Create a regex for case-insensitive search
        const searchRegex = new RegExp(searchQuery, 'i');

        // Find users matching name or email in the specified university, excluding the current user
        const users = await User.find({
            university: university, // Match university exactly
            _id: { $ne: currentUserId }, // Exclude self
            $or: [
                { name: searchRegex },
                { email: searchRegex }
            ]
        })
        .select('name email _id university') // Select only necessary fields
        .limit(10); // Limit results for performance

        res.json(users);

    } catch (err) {
        next(err);
    }
});

// @desc    Get public profile of a user by ID
// @route   GET /api/users/:userId/profile
// @access  Private (Any logged-in user can view public profiles)
router.get('/:userId/profile', protect, async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId)
            .select('name university bio photos createdAt'); // Select only public fields

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);

    } catch (err) {
         if (err.kind === 'ObjectId') {
             return res.status(404).json({ message: 'User not found' });
        }
        next(err);
    }
});


// Optional: Route to delete a photo
// @desc    Delete a photo from user profile
// @route   DELETE /api/users/me/photos/:photo_public_id
// @access  Private
router.delete('/me/photos/:photo_public_id', protect, async (req, res, next) => { // Added next
    const userId = req.user.id;
    const photoPublicId = req.params.photo_public_id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find the photo in the user's array
        const photoIndex = user.photos.findIndex(p => p.public_id === photoPublicId);
        if (photoIndex === -1) {
            return res.status(404).json({ message: 'Photo not found' });
        }

        // Remove photo from Cloudinary
        await cloudinary.uploader.destroy(photoPublicId);

        // Remove photo from user's array
        user.photos.splice(photoIndex, 1);
        await user.save();

        res.json({ message: 'Photo deleted successfully' });

    } catch (err) {
        next(err); // Pass error to middleware
    }
});


module.exports = router;
