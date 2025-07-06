import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { CoupleIcon, DateIcon } from '../components/ui/SocialIcons';

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

    // Display loading state
    if (loading) {
        return (
            <div className="bg-neutral-50 min-h-screen">
                <div className="container py-16">
                    <div className="text-center animate-fade-in">
                        <div className="flex justify-center mb-6">
                            <div className="bg-neutral-200 rounded-full p-6">
                                <CoupleIcon className="text-neutral-500" size={48} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-semibold text-neutral-800 mb-4">Loading Profile...</h2>
                        <p className="text-neutral-600">Please wait while we fetch the profile data</p>
                    </div>
                </div>
            </div>
        );
    }

    // Display error message
    if (error) {
        return (
            <div className="bg-neutral-50 min-h-screen">
                <div className="container py-16">
                    <div className="text-center">
                        <div className="bg-error bg-opacity-10 border border-error text-error p-6 rounded-lg max-w-md mx-auto">
                            <h3 className="font-semibold mb-2">Error Loading Profile</h3>
                            <p>{error}</p>
                            <button 
                                onClick={() => window.history.back()}
                                className="mt-4 px-4 py-2 bg-neutral-500 text-white rounded hover:bg-neutral-600 transition-colors"
                            >
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="bg-neutral-50 min-h-screen">
                <div className="container py-16">
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold text-neutral-800 mb-4">Profile not found.</h2>
                        <button 
                            onClick={() => window.history.back()}
                            className="px-4 py-2 bg-neutral-500 text-white rounded hover:bg-neutral-600 transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-neutral-50 min-h-screen">
            <div className="container py-8">
                {/* Profile Header */}
                <div className="text-center mb-12 animate-fade-in">
                    <div className="flex justify-center mb-4">
                        <div className="bg-gradient-love rounded-full p-4">
                            <CoupleIcon className="text-white" size={32} />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-neutral-800 mb-4 font-family-heading">
                        {profile.name}'s <span className="text-gradient">Profile</span>
                    </h1>
                    <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                        Get to know {profile.name} and discover shared interests
                    </p>
                </div>

                {/* Profile Info Card */}
                <div className="card mb-8 animate-slide-up">
                    <div className="card-header">
                        <h2 className="text-xl font-semibold text-neutral-800">Profile Information</h2>
                    </div>
                    <div className="card-body">
                        <div className="flex items-center gap-6 mb-6">
                            <div className="w-20 h-20 bg-gradient-sunset rounded-full flex items-center justify-center text-white text-3xl font-bold">
                                {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
        <div>
                                <h3 className="text-2xl font-semibold text-neutral-800">{profile.name}</h3>
                                <div className="flex items-center gap-2 flex-wrap mt-2">
                                    <span className="badge badge-primary">{profile.university}</span>
                                    {profile.age && <span className="badge badge-outline">Age {profile.age}</span>}
                                    {profile.major && <span className="badge badge-outline">{profile.major}</span>}
                                    {profile.mbti && <span className="badge badge-secondary">{profile.mbti}</span>}
                                </div>
                                <p className="text-neutral-500 text-sm mt-2">
                                    Member since {new Date(profile.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        {profile.bio && (
                            <div className="bg-neutral-50 rounded-lg p-4">
                                <h4 className="font-semibold text-neutral-700 mb-2">About {profile.name}</h4>
                                <p className="text-neutral-600">{profile.bio}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Enhanced Profile Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    
                    {/* Personality & Social Style */}
                    {(profile.personalityTraits?.length > 0 || profile.socialStyle) && (
                        <div className="card animate-slide-up">
                            <div className="card-header">
                                <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                                    🧠 Personality
                                </h3>
                            </div>
                            <div className="card-body">
                                {profile.socialStyle && (
                                    <div className="mb-4">
                                        <span className="text-sm font-medium text-neutral-600">Social Style:</span>
                                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                            {profile.socialStyle}
                                        </span>
                                    </div>
                                )}
                                {profile.personalityTraits?.length > 0 && (
                                    <div>
                                        <span className="text-sm font-medium text-neutral-600 block mb-2">Personality Traits:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.personalityTraits.map((trait, index) => (
                                                <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                                                    {trait}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Academic Interests */}
                    {profile.academicInterests?.length > 0 && (
                        <div className="card animate-slide-up">
                            <div className="card-header">
                                <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                                    📚 Academic Interests
                                </h3>
                            </div>
                            <div className="card-body">
                                <div className="flex flex-wrap gap-2">
                                    {profile.academicInterests.map((interest, index) => (
                                        <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                            {interest}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Hobbies & Activities */}
                    {profile.hobbies?.length > 0 && (
                        <div className="card animate-slide-up">
                            <div className="card-header">
                                <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                                    🎯 Hobbies & Activities
                                </h3>
                            </div>
                            <div className="card-body">
                                <div className="flex flex-wrap gap-2">
                                    {profile.hobbies.map((hobby, index) => (
                                        <span key={index} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                                            {hobby}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Entertainment Preferences */}
                    {(profile.musicGenres?.length > 0 || profile.movieGenres?.length > 0) && (
                        <div className="card animate-slide-up">
                            <div className="card-header">
                                <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                                    🎵 Entertainment
                                </h3>
                            </div>
                            <div className="card-body space-y-4">
                                {profile.musicGenres?.length > 0 && (
                                    <div>
                                        <span className="text-sm font-medium text-neutral-600 block mb-2">Music:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.musicGenres.map((genre, index) => (
                                                <span key={index} className="px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">
                                                    {genre}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {profile.movieGenres?.length > 0 && (
                                    <div>
                                        <span className="text-sm font-medium text-neutral-600 block mb-2">Movies:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.movieGenres.map((genre, index) => (
                                                <span key={index} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                                                    {genre}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Sports & Fitness */}
                    {profile.sports?.length > 0 && (
                        <div className="card animate-slide-up">
                            <div className="card-header">
                                <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                                    ⚽ Sports & Fitness
                                </h3>
                            </div>
                            <div className="card-body">
                                <div className="flex flex-wrap gap-2">
                                    {profile.sports.map((sport, index) => (
                                        <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                                            {sport}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Friendship Goals */}
                    {profile.friendshipGoals?.length > 0 && (
                        <div className="card animate-slide-up">
                            <div className="card-header">
                                <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                                    👥 Looking For
                                </h3>
                            </div>
                            <div className="card-body">
                                <div className="flex flex-wrap gap-2">
                                    {profile.friendshipGoals.map((goal, index) => (
                                        <span key={index} className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm">
                                            {goal}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Languages & Food */}
                    {(profile.languages?.length > 0 || profile.foodPreferences?.length > 0) && (
                        <div className="card animate-slide-up">
                            <div className="card-header">
                                <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                                    🌍 Lifestyle
                                </h3>
                            </div>
                            <div className="card-body space-y-4">
                                {profile.languages?.length > 0 && (
                                    <div>
                                        <span className="text-sm font-medium text-neutral-600 block mb-2">Languages:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.languages.map((language, index) => (
                                                <span key={index} className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full text-sm">
                                                    {language}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {profile.foodPreferences?.length > 0 && (
                                    <div>
                                        <span className="text-sm font-medium text-neutral-600 block mb-2">Food Preferences:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.foodPreferences.map((food, index) => (
                                                <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                                                    {food}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Photos Section */}
                <div className="card mb-8 animate-slide-up">
                    <div className="card-header">
                        <h2 className="text-xl font-semibold text-neutral-800">Photos</h2>
                    </div>
                    <div className="card-body">
             {profile.photos && profile.photos.length > 0 ? (
                            <div className="grid grid-3 gap-4">
                {profile.photos.map(photo => (
                                    <div key={photo.public_id} className="relative group">
                                        <img 
                                            src={photo.url} 
                                            alt="Profile" 
                                            className="w-full h-32 object-cover rounded-lg shadow-md" 
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="flex justify-center mb-4">
                                    <div className="bg-neutral-200 rounded-full p-4">
                                        <DateIcon className="text-neutral-500" size={32} />
                                    </div>
                                </div>
                                <p className="text-neutral-600">No photos available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="card mb-8 animate-slide-up">
                    <div className="card-header">
                        <h2 className="text-xl font-semibold text-neutral-800">
                            Reviews Received ({reviews.length})
                        </h2>
                    </div>
                    <div className="card-body">
                {reviewsLoading ? (
                            <div className="text-center py-8">
                                <p className="text-neutral-600">Loading reviews...</p>
                            </div>
                ) : reviewsError ? (
                            <div className="text-center py-8">
                                <p className="text-error">Error loading reviews: {reviewsError}</p>
                            </div>
                ) : reviews.length > 0 ? (
                            <div className="space-y-4">
                        {reviews.map(review => {
                            const memberRating = review.memberRatings?.find(mr => mr.userId === userId);
                            return (
                                        <div key={review._id} className="border-b border-neutral-200 pb-4 last:border-b-0">
                                    {memberRating && (
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-sm font-medium text-neutral-600">Rating:</span>
                                                    <div className="text-yellow-500">
                                                        {'★'.repeat(memberRating.rating)}{'☆'.repeat(5 - memberRating.rating)}
                                                    </div>
                                                </div>
                                            )}
                                            {review.comment && (
                                                <p className="text-neutral-700 italic mb-3">"{review.comment}"</p>
                                            )}
                                            <div className="text-sm text-neutral-500">
                                        From: {review.reviewer?.name || 'Anonymous'} (Team {review.reviewingTeam?.name || 'Unknown'})
                                        {' '} regarding Team {review.reviewedTeam?.name || 'Unknown'}
                                        {' '} on {new Date(review.createdAt).toLocaleDateString()}
                                    </div>
                                        </div>
                            );
                        })}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-neutral-600">No reviews received yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <div className="text-center">
                    <button 
                        onClick={() => window.history.back()}
                        className="btn btn-outline"
                    >
                        Go Back
                    </button>
                </div>
             </div>
        </div>
    );
};

export default PublicProfilePage;
