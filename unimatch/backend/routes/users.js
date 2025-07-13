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
      major: user.major,
      mbti: user.mbti,
      socialStyle: user.socialStyle,
      academicInterests: user.academicInterests,
      personalityTraits: user.personalityTraits,
      hobbies: user.hobbies,
      musicGenres: user.musicGenres,
      movieGenres: user.movieGenres,
      sports: user.sports,
      friendshipGoals: user.friendshipGoals,
      languages: user.languages,
      foodPreferences: user.foodPreferences,
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
  const { 
    name, 
    bio, 
    major,
    mbti,
    socialStyle,
    academicInterests,
    personalityTraits,
    hobbies,
    musicGenres,
    movieGenres,
    sports,
    friendshipGoals,
    languages,
    foodPreferences
  } = req.body;
  const userId = req.user.id;

  try {
    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if they are provided in the request body
    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (major !== undefined) user.major = major;
    if (mbti !== undefined) user.mbti = mbti;
    if (socialStyle !== undefined) user.socialStyle = socialStyle;
    if (academicInterests !== undefined) user.academicInterests = academicInterests;
    if (personalityTraits !== undefined) user.personalityTraits = personalityTraits;
    if (hobbies !== undefined) user.hobbies = hobbies;
    if (musicGenres !== undefined) user.musicGenres = musicGenres;
    if (movieGenres !== undefined) user.movieGenres = movieGenres;
    if (sports !== undefined) user.sports = sports;
    if (friendshipGoals !== undefined) user.friendshipGoals = friendshipGoals;
    if (languages !== undefined) user.languages = languages;
    if (foodPreferences !== undefined) user.foodPreferences = foodPreferences;
    
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
      major: updatedUser.major,
      mbti: updatedUser.mbti,
      socialStyle: updatedUser.socialStyle,
      academicInterests: updatedUser.academicInterests,
      personalityTraits: updatedUser.personalityTraits,
      hobbies: updatedUser.hobbies,
      musicGenres: updatedUser.musicGenres,
      movieGenres: updatedUser.movieGenres,
      sports: updatedUser.sports,
      friendshipGoals: updatedUser.friendshipGoals,
      languages: updatedUser.languages,
      foodPreferences: updatedUser.foodPreferences,
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

        // Check if user has reached photo limit (optional)
        const MAX_PHOTOS = 10;
        if (user.photos.length >= MAX_PHOTOS) {
            return res.status(400).json({ message: `Maximum number of photos reached (${MAX_PHOTOS})` });
        }

        // Check Cloudinary configuration
        if (!process.env.CLOUDINARY_CLOUD_NAME || 
            !process.env.CLOUDINARY_API_KEY || 
            !process.env.CLOUDINARY_API_SECRET) {
            console.error('Cloudinary configuration missing');
            return res.status(500).json({ 
                message: 'Photo upload service not configured. Please contact administrator.' 
            });
        }

        // Upload image buffer to Cloudinary using a stream
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `unimatch/user_photos/${userId}`, // Optional: Organize uploads in folders
                transformation: [{ width: 800, height: 800, crop: "limit" }], // Resize for consistency
                format: 'jpg', // Convert to jpg for consistency
                quality: 'auto' // Optimize quality
            },
            async (error, result) => {
                if (error) {
                    console.error('Cloudinary Upload Error:', error);
                    let errorMessage = 'Error uploading photo to cloud storage';
                    
                    // Provide more specific error messages
                    if (error.message.includes('Invalid cloud_name')) {
                        errorMessage = 'Cloudinary cloud name is invalid';
                    } else if (error.message.includes('Invalid API key')) {
                        errorMessage = 'Cloudinary API key is invalid';
                    } else if (error.message.includes('Invalid API secret')) {
                        errorMessage = 'Cloudinary API secret is invalid';
                    }
                    
                    return res.status(500).json({ message: errorMessage });
                }

                try {
                    // Add photo info to user's photos array
                    const newPhoto = {
                        url: result.secure_url,
                        public_id: result.public_id,
                        isVerified: false, // Set verification status later if needed
                    };

                    user.photos.push(newPhoto);
                    await user.save();

                    console.log(`Photo uploaded successfully for user ${userId}: ${result.public_id}`);

                    // Return the new photo info
                    res.status(201).json(newPhoto);
                } catch (saveError) {
                    console.error('Error saving photo to database:', saveError);
                    // Try to delete the uploaded image from Cloudinary if database save fails
                    try {
                        await cloudinary.uploader.destroy(result.public_id);
                    } catch (deleteError) {
                        console.error('Error cleaning up Cloudinary image:', deleteError);
                    }
                    return res.status(500).json({ message: 'Error saving photo information' });
                }
            }
        );

        // Pipe the buffer from multer into the Cloudinary upload stream
        uploadStream.end(req.file.buffer);

    } catch (err) {
        console.error('Photo upload route error:', err);
        next(err); // Pass error to middleware
    }
}, (error, req, res, next) => { // This is Multer's error handler
    // Handle Multer errors (e.g., file size limit) - pass to general handler
    console.error('Multer error:', error);
    res.status(400).json({ message: error.message });
});

// @desc    Search for users by name/email within a specific university
// @route   GET /api/users/search?q=searchText&university=uniName
// @access  Private
router.get('/search', protect, async (req, res, next) => {
    const searchQuery = req.query.q || '';
    const university = req.query.university || '';
    const currentUserId = req.user.id; // Don't include the logged-in user in search results

    console.log(`=== USER SEARCH DEBUG ===`);
    console.log(`Search query: "${searchQuery}"`);
    console.log(`University: "${university}"`);
    console.log(`Current user: ${currentUserId}`);

    if (!university) {
        return res.status(400).json({ message: 'University parameter is required for search.' });
    }
    if (!searchQuery) {
         return res.json([]); // Return empty if search query is empty
    }

    try {
        // Create a regex for case-insensitive search
        const searchRegex = new RegExp(searchQuery, 'i');
        
        // Create a more specific regex for exact email matches
        const exactEmailRegex = new RegExp(`^${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

        console.log(`Search regex: ${searchRegex}`);
        console.log(`Exact email regex: ${exactEmailRegex}`);

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
        .limit(20) // Increased limit for better results
        .lean(); // Use lean for better performance

        console.log(`Found ${users.length} users before sorting`);

        // Sort results to prioritize exact email matches, then partial email matches, then name matches
        const sortedUsers = users.sort((a, b) => {
            const aExactEmail = exactEmailRegex.test(a.email);
            const bExactEmail = exactEmailRegex.test(b.email);
            const aPartialEmail = searchRegex.test(a.email) && !exactEmailRegex.test(a.email);
            const bPartialEmail = searchRegex.test(b.email) && !exactEmailRegex.test(b.email);
            
            // Priority: 1. Exact email match, 2. Partial email match, 3. Name match
            if (aExactEmail && !bExactEmail) return -1;
            if (!aExactEmail && bExactEmail) return 1;
            if (aPartialEmail && !bPartialEmail && !bExactEmail) return -1;
            if (!aPartialEmail && bPartialEmail && !aExactEmail) return 1;
            
            // If same priority, sort alphabetically by name
            return a.name.localeCompare(b.name);
        });

        console.log(`Sorted results: ${sortedUsers.map(u => `${u.name} (${u.email})`).join(', ')}`);

        // Return top 10 results
        const finalResults = sortedUsers.slice(0, 10);
        console.log(`✅ Returning ${finalResults.length} search results`);

        res.json(finalResults);

    } catch (err) {
        console.error('❌ Error in user search:', err);
        next(err);
    }
});

// @desc    Get public profile of a user by ID
// @route   GET /api/users/:userId/profile
// @access  Private (Any logged-in user can view public profiles)
router.get('/:userId/profile', protect, async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId)
            .select('name university bio photos createdAt age major mbti socialStyle academicInterests personalityTraits hobbies musicGenres movieGenres sports friendshipGoals languages foodPreferences'); // Select public fields

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


// @desc    Delete a photo from user profile
// @route   DELETE /api/users/me/photos/:photo_public_id
// @access  Private
router.delete('/me/photos/:photo_public_id', protect, async (req, res, next) => { // Added next
    const userId = req.user.id;
    // Decode the URL-encoded public_id to handle forward slashes
    const photoPublicId = decodeURIComponent(req.params.photo_public_id);

    console.log(`Attempting to delete photo with public_id: ${photoPublicId} for user: ${userId}`);

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find the photo in the user's array
        const photoIndex = user.photos.findIndex(p => p.public_id === photoPublicId);
        if (photoIndex === -1) {
            console.log(`Photo not found in user's photos array. Available photos:`, user.photos.map(p => p.public_id));
            return res.status(404).json({ message: 'Photo not found' });
        }

        // Remove photo from Cloudinary
        console.log(`Deleting photo from Cloudinary: ${photoPublicId}`);
        await cloudinary.uploader.destroy(photoPublicId);

        // Remove photo from user's array
        user.photos.splice(photoIndex, 1);
        await user.save();

        console.log(`Photo deleted successfully: ${photoPublicId}`);
        res.json({ message: 'Photo deleted successfully' });

    } catch (err) {
        console.error('Error deleting photo:', err);
        next(err); // Pass error to middleware
    }
});


module.exports = router;
