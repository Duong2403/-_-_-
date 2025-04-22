import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const PublicProfilePage = () => {
    const { userId } = useParams(); // Get userId from URL parameter
    const [profile, setProfile] = useState(null);
    const [reviews, setReviews] = useState([]); // State for reviews
    const [loading, setLoading] = useState(true); // Combined loading for profile
    const [error, setError] = useState(''); // Combined error for profile
    const [reviewsLoading, setReviewsLoading] = useState(true); // Separate loading for reviews
    const [reviewsError, setReviewsError] = useState(''); // Separate error for reviews

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await api.get(`/users/${userId}/profile`);
                setProfile(res.data);
            } catch (err) {
                console.error("Error fetching public profile:", err);
                setError(err.response?.data?.message || 'Failed to fetch profile.');
            } finally {
                setLoading(false);
            }
        };

        // REMOVED EXTRA BRACE HERE

        const fetchUserReviews = async () => {
            if (!userId) return;
            setReviewsLoading(true);
            setReviewsError('');
            try {
                const res = await api.get(`/reviews/user/${userId}`);
                setReviews(res.data);
            } catch (err) {
                console.error("Error fetching user reviews:", err);
                setReviewsError(err.response?.data?.message || 'Failed to fetch reviews.');
            } finally {
                setReviewsLoading(false);
            }
        };

        if (userId) {
            fetchProfile();
            fetchUserReviews(); // Fetch reviews as well
        }
    }, [userId]);

    if (loading) return <p>Loading profile...</p>;
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
    if (!profile) return <p>Profile not found.</p>;

    return (
        <div>
            <h2>{profile.name}'s Profile</h2>
            <p><strong>University:</strong> {profile.university}</p>
            <p><strong>Bio:</strong> {profile.bio || 'No bio provided.'}</p>
            <p><strong>Member Since:</strong> {new Date(profile.createdAt).toLocaleDateString()}</p>

            <h3>Photos</h3>
             {profile.photos && profile.photos.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {profile.photos.map(photo => (
                    <div key={photo.public_id}>
                    <img src={photo.url} alt="User profile" style={{ width: '150px', height: '150px', objectFit: 'cover' }} />
                    </div>
                ))}
                </div>
            ) : (
                <p>No photos available.</p>
            )}

            {/* --- Reviews Section --- */}
            <div style={{ marginTop: '30px', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
                <h3>Reviews Received ({reviews.length})</h3>
                {reviewsLoading ? (
                    <p>Loading reviews...</p>
                ) : reviewsError ? (
                    <p style={{ color: 'red' }}>Error loading reviews: {reviewsError}</p>
                ) : reviews.length > 0 ? (
                    <ul>
                        {reviews.map(review => {
                            // Find the specific rating for this user within the review
                            const memberRating = review.memberRatings?.find(mr => mr.userId === userId);
                            return (
                                <li key={review._id} style={{ marginBottom: '15px', borderBottom: '1px dashed #eee', paddingBottom: '10px' }}>
                                    {memberRating && (
                                        <div><strong>Rating: {'★'.repeat(memberRating.rating)}{'☆'.repeat(5 - memberRating.rating)}</strong></div>
                                    )}
                                    {review.comment && <p style={{ fontStyle: 'italic', margin: '5px 0' }}>"{review.comment}"</p>}
                                    <div style={{ fontSize: '0.9em', color: 'gray' }}>
                                        From: {review.reviewer?.name || 'Anonymous'} (Team {review.reviewingTeam?.name || 'Unknown'})
                                        {' '} regarding Team {review.reviewedTeam?.name || 'Unknown'}
                                        {' '} on {new Date(review.createdAt).toLocaleDateString()}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p>No reviews received yet.</p>
                )}
            </div>

             {/* Add back button or other navigation as needed */}
             <div style={{ marginTop: '20px' }}>
                 {/* Example: Go back using browser history */}
                 <button onClick={() => window.history.back()}>Go Back</button>
             </div>
        </div>
    );
};

export default PublicProfilePage;
