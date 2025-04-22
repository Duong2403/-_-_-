const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Match = require('../models/Match');
const Team = require('../models/Team');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Helper to check if user was part of the specific match
const wasUserInMatch = async (matchId, userId) => {
    const match = await Match.findById(matchId).populate('requestingTeam receivingTeam');
    if (!match) return { inMatch: false }; // Match not found

    const requestingTeam = match.requestingTeam;
    const receivingTeam = match.receivingTeam;

    const isRequestingMember = requestingTeam?.members.some(m => m.equals(userId));
    const isReceivingMember = receivingTeam?.members.some(m => m.equals(userId));

    if (isRequestingMember) {
        return { inMatch: true, userTeam: requestingTeam, opponentTeam: receivingTeam };
    } else if (isReceivingMember) {
        return { inMatch: true, userTeam: receivingTeam, opponentTeam: requestingTeam };
    } else {
        return { inMatch: false };
    }
};

// @desc    Submit a new review for a completed match
// @route   POST /api/reviews
// @access  Private
router.post('/', protect, async (req, res, next) => {
    const { matchId, teamRating, memberRatings, comment } = req.body;
    const reviewerId = req.user.id;

    if (!matchId || !teamRating) {
        return res.status(400).json({ message: 'Match ID and team rating are required.' });
    }

    try {
        // 1. Verify user was part of the match and identify teams
        const { inMatch, userTeam, opponentTeam } = await wasUserInMatch(matchId, reviewerId);
        if (!inMatch || !userTeam || !opponentTeam) {
            return res.status(403).json({ message: 'You were not part of this match or teams are invalid.' });
        }

        // 2. Check if match status allows reviewing (e.g., 'accepted' or maybe a custom 'completed' status)
        const match = await Match.findById(matchId);
        if (match.status !== 'accepted') { // Adjust if you add a 'completed' status later
             return res.status(400).json({ message: `Match status (${match.status}) does not allow reviews.` });
        }

        // 3. Check if user already reviewed this opponent team for this match
        const existingReview = await Review.findOne({ match: matchId, reviewer: reviewerId, reviewedTeam: opponentTeam._id });
        if (existingReview) {
            return res.status(400).json({ message: 'You have already submitted a review for this team in this match.' });
        }

        // 4. Validate memberRatings if provided (ensure users are part of the opponent team)
        if (memberRatings && memberRatings.length > 0) {
            const opponentMemberIds = opponentTeam.members.map(m => m.toString());
            const invalidMemberRating = memberRatings.some(mr => !opponentMemberIds.includes(mr.userId.toString()));
            if (invalidMemberRating) {
                return res.status(400).json({ message: 'Invalid user ID found in member ratings. Must be members of the reviewed team.' });
            }
        }

        // 5. Create and save the review
        const newReview = new Review({
            match: matchId,
            reviewer: reviewerId,
            reviewingTeam: userTeam._id,
            reviewedTeam: opponentTeam._id,
            teamRating,
            memberRatings: memberRatings || [], // Default to empty array if not provided
            comment
        });

        const savedReview = await newReview.save();
        const populatedReview = await Review.findById(savedReview._id)
                                        .populate('reviewer', 'name')
                                        .populate('reviewedTeam', 'name')
                                        .populate('memberRatings.userId', 'name'); // Populate names

        res.status(201).json(populatedReview);

    } catch (err) {
        // Handle potential unique index violation (already reviewed)
        if (err.code === 11000) {
             return res.status(400).json({ message: 'You have already submitted a review for this team in this match.' });
        }
        next(err);
    }
});

// @desc    Get all reviews received by a specific team
// @route   GET /api/reviews/team/:teamId
// @access  Public
router.get('/team/:teamId', async (req, res, next) => {
    try {
        const reviews = await Review.find({ reviewedTeam: req.params.teamId })
            .populate('reviewer', 'name') // Show reviewer's name
            .populate('reviewingTeam', 'name') // Show reviewing team's name
            .populate('memberRatings.userId', 'name') // Populate names in member ratings
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (err) {
        next(err);
    }
});

// @desc    Get all reviews received by a specific user (based on memberRatings)
// @route   GET /api/reviews/user/:userId
// @access  Public
router.get('/user/:userId', async (req, res, next) => {
    try {
        // Find reviews where the user ID is present in the memberRatings array
        const reviews = await Review.find({ 'memberRatings.userId': req.params.userId })
            .populate('reviewer', 'name')
            .populate('reviewingTeam', 'name')
            .populate('reviewedTeam', 'name')
            // We don't need to populate memberRatings.userId again here
            .sort({ createdAt: -1 });

        // Optionally, filter the memberRatings within each review to only show the relevant user's rating?
        // Or just return the full review context. For now, return full context.

        res.json(reviews);
    } catch (err) {
        next(err);
    }
});


module.exports = router;
