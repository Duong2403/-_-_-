import React, { useState, useEffect } from 'react';
import api from '../../services/api'; // Assuming api instance is available globally or passed

// Basic Modal Styling (reuse or adapt from ScheduleMeetingModal)
const modalStyle = {
    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    backgroundColor: 'white', padding: '30px', borderRadius: '8px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.2)', zIndex: 1000, width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto'
};
const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999
};

// Simple Star Rating Component
const StarRating = ({ rating, setRating }) => {
    return (
        <div>
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    style={{ cursor: 'pointer', color: star <= rating ? 'gold' : 'grey', fontSize: '2em' }}
                    onClick={() => setRating(star)}
                >
                    ★
                </span>
            ))}
        </div>
    );
};


const SubmitReviewModal = ({ match, userTeam, opponentTeam, onClose, onReviewSubmitted }) => {
    const [teamRating, setTeamRating] = useState(0);
    const [memberRatings, setMemberRatings] = useState({}); // Store as { userId: rating }
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Initialize member ratings state
    useEffect(() => {
        if (opponentTeam?.members) {
            const initialRatings = {};
            opponentTeam.members.forEach(member => {
                initialRatings[member._id] = 0; // Default to 0 stars initially
            });
            setMemberRatings(initialRatings);
        }
    }, [opponentTeam]);

    const handleMemberRatingChange = (userId, rating) => {
        setMemberRatings(prev => ({ ...prev, [userId]: rating }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (teamRating === 0) {
            setError('Please provide an overall rating for the team.');
            return;
        }
        // Validate member ratings (ensure all are rated)
        const ratedMembers = Object.entries(memberRatings).filter(([_, rating]) => rating > 0);
        if (ratedMembers.length !== opponentTeam.members.length) {
             // Optional: Make member ratings mandatory? For now, allow partial/no member ratings if team rating exists.
             // setError('Please rate all members of the opponent team.');
             // return;
        }

        setLoading(true);
        setError('');

        const reviewData = {
            matchId: match._id,
            teamRating,
            // Convert memberRatings state to the array format expected by backend
            memberRatings: Object.entries(memberRatings)
                                .filter(([_, rating]) => rating > 0) // Only include rated members
                                .map(([userId, rating]) => ({ userId, rating })),
            comment: comment.trim() || undefined,
        };

        try {
            // Use the global api instance or one passed via props
            const res = await api.post('/reviews', reviewData);
            onReviewSubmitted(res.data); // Notify parent
            onClose(); // Close modal on success
            alert('Review submitted successfully!');
        } catch (err) {
            console.error("Error submitting review:", err);
            setError(err.response?.data?.message || 'Failed to submit review.');
        } finally {
            setLoading(false);
        }
    };

    if (!match || !userTeam || !opponentTeam) {
        return null; // Or show an error/loading state
    }

    return (
        <>
            <div style={overlayStyle} onClick={onClose}></div>
            <div style={modalStyle}>
                <h2>Review Team: {opponentTeam.name}</h2>
                <form onSubmit={handleSubmit}>
                    {error && <p style={{ color: 'red' }}>{error}</p>}

                    {/* Team Rating */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Overall Team Rating:</label>
                        <StarRating rating={teamRating} setRating={setTeamRating} />
                    </div>

                    {/* Member Ratings */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Rate Individual Members:</label>
                        {opponentTeam.members.map(member => (
                            <div key={member._id} style={{ marginBottom: '10px', paddingLeft: '10px' }}>
                                <span>{member.name}: </span>
                                <StarRating
                                    rating={memberRatings[member._id] || 0}
                                    setRating={(rating) => handleMemberRatingChange(member._id, rating)}
                                />
                            </div>
                        ))}
                    </div>

                     {/* Comment */}
                     <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="comment">Comment (Public):</label>
                        <textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows="4"
                            style={{ width: '100%', marginTop: '5px' }}
                            placeholder="Share your experience with this team..."
                        />
                    </div>

                    {/* Actions */}
                    <div style={{ textAlign: 'right' }}>
                        <button type="button" onClick={onClose} disabled={loading} style={{ marginRight: '10px', background: '#6c757d' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={loading || teamRating === 0}>
                            {loading ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default SubmitReviewModal;
