import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PhotoUpload from '../components/PhotoUpload';
import ProfileEditForm from '../components/ProfileEditForm';
import { CoupleIcon, DateIcon } from '../components/ui/SocialIcons';


const ProfilePage = () => {
  const { user: authUser, loading: authLoading, setUser: setAuthUser } = useAuth(); // Get user from auth context
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Function to handle successful photo upload
  const handleUploadSuccess = (newPhoto) => {
    // Update the profile data state to include the new photo
    setProfileData(prevData => ({
        ...prevData,
        photos: [...(prevData?.photos || []), newPhoto]
    }));
     // Also update the user in the auth context if needed, though refetch might handle this
     setAuthUser(prevData => ({
        ...prevData,
        photos: [...(prevData?.photos || []), newPhoto]
    }));
  };

   // Function to handle photo deletion
  const handleDeletePhoto = async (publicId) => {
      if (!window.confirm('Are you sure you want to delete this photo?')) {
          return;
      }
      setError('');
      try {
          // URL encode the public_id to handle forward slashes
          const encodedPublicId = encodeURIComponent(publicId);
          await api.delete(`/users/me/photos/${encodedPublicId}`);
          // Update state after successful deletion
          const updatedPhotos = profileData.photos.filter(p => p.public_id !== publicId);
          setProfileData(prevData => ({ ...prevData, photos: updatedPhotos }));
          setAuthUser(prevData => ({ ...prevData, photos: updatedPhotos }));
          // Show success message
          alert('Photo deleted successfully!');
      } catch (err) {
          console.error("Error deleting photo:", err);
          console.error("Error details:", err.response?.data);
          setError(err.response?.data?.message || 'Failed to delete photo.');
      }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      // Don't fetch if auth is still loading or user isn't authenticated
      if (authLoading || !authUser) {
         setLoading(false); // Stop loading if not authenticated
         return;
      }
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/users/me');
        setProfileData(res.data);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(err.response?.data?.message || 'Failed to fetch profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [authUser, authLoading]); // Refetch if authUser changes (e.g., after update)

  // Display loading state
  if (loading || authLoading) {
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
            <p className="text-neutral-600">Please wait while we fetch your data</p>
          </div>
        </div>
      </div>
    );
  }

  // Display error message if fetch failed
  if (error) {
    return (
      <div className="bg-neutral-50 min-h-screen">
        <div className="container py-16">
          <div className="text-center">
            <div className="bg-error bg-opacity-10 border border-error text-error p-6 rounded-lg max-w-md mx-auto">
              <h3 className="font-semibold mb-2">Error Loading Profile</h3>
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Display message if not authenticated
  if (!profileData && !authUser) {
    return (
      <div className="bg-neutral-50 min-h-screen">
        <div className="container py-16">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-neutral-800 mb-4">Please log in to view your profile.</h2>
          </div>
        </div>
      </div>
    );
  }

  // Use profileData if available, otherwise fallback to authUser (might be slightly stale)
  const displayUser = profileData || authUser;

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="container py-8">
        {displayUser ? (
          <>
            {/* Profile Header */}
            <div className="text-center mb-12 animate-fade-in">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-love rounded-full p-4">
                  <CoupleIcon className="text-white" size={32} />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-neutral-800 mb-4 font-family-heading">
                Your <span className="text-gradient">Profile</span>
              </h1>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                Manage your profile to make great connections with other university groups
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
                    {displayUser.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-neutral-800">{displayUser.name}</h3>
                    <p className="text-neutral-600 mb-2">{displayUser.email}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="badge badge-primary">{displayUser.university}</span>
                      {displayUser.age && <span className="badge badge-outline">Age {displayUser.age}</span>}
                      {displayUser.major && <span className="badge badge-outline">{displayUser.major}</span>}
                      {displayUser.mbti && <span className="badge badge-secondary">{displayUser.mbti}</span>}
                    </div>
                  </div>
                </div>
                {displayUser.bio && (
                  <div className="bg-neutral-50 rounded-lg p-4">
                    <h4 className="font-semibold text-neutral-700 mb-2">About Me</h4>
                    <p className="text-neutral-600">{displayUser.bio}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Profile Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              
              {/* Personality & Social Style */}
              {(displayUser.personalityTraits?.length > 0 || displayUser.socialStyle) && (
                <div className="card animate-slide-up">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                      🧠 Personality
                    </h3>
                  </div>
                  <div className="card-body">
                    {displayUser.socialStyle && (
                      <div className="mb-4">
                        <span className="text-sm font-medium text-neutral-600">Social Style:</span>
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {displayUser.socialStyle}
                        </span>
                      </div>
                    )}
                    {displayUser.personalityTraits?.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-neutral-600 block mb-2">Personality Traits:</span>
                        <div className="flex flex-wrap gap-2">
                          {displayUser.personalityTraits.map((trait, index) => (
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
              {displayUser.academicInterests?.length > 0 && (
                <div className="card animate-slide-up">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                      📚 Academic Interests
                    </h3>
                  </div>
                  <div className="card-body">
                    <div className="flex flex-wrap gap-2">
                      {displayUser.academicInterests.map((interest, index) => (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Hobbies & Activities */}
              {displayUser.hobbies?.length > 0 && (
                <div className="card animate-slide-up">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                      🎯 Hobbies & Activities
                    </h3>
                  </div>
                  <div className="card-body">
                    <div className="flex flex-wrap gap-2">
                      {displayUser.hobbies.map((hobby, index) => (
                        <span key={index} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                          {hobby}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Entertainment Preferences */}
              {(displayUser.musicGenres?.length > 0 || displayUser.movieGenres?.length > 0) && (
                <div className="card animate-slide-up">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                      🎵 Entertainment
                    </h3>
                  </div>
                  <div className="card-body space-y-4">
                    {displayUser.musicGenres?.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-neutral-600 block mb-2">Music:</span>
                        <div className="flex flex-wrap gap-2">
                          {displayUser.musicGenres.map((genre, index) => (
                            <span key={index} className="px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">
                              {genre}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {displayUser.movieGenres?.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-neutral-600 block mb-2">Movies:</span>
                        <div className="flex flex-wrap gap-2">
                          {displayUser.movieGenres.map((genre, index) => (
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
              {displayUser.sports?.length > 0 && (
                <div className="card animate-slide-up">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                      ⚽ Sports & Fitness
                    </h3>
                  </div>
                  <div className="card-body">
                    <div className="flex flex-wrap gap-2">
                      {displayUser.sports.map((sport, index) => (
                        <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                          {sport}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Friendship Goals */}
              {displayUser.friendshipGoals?.length > 0 && (
                <div className="card animate-slide-up">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                      👥 Looking For
                    </h3>
                  </div>
                  <div className="card-body">
                    <div className="flex flex-wrap gap-2">
                      {displayUser.friendshipGoals.map((goal, index) => (
                        <span key={index} className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm">
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Languages & Food */}
              {(displayUser.languages?.length > 0 || displayUser.foodPreferences?.length > 0) && (
                <div className="card animate-slide-up">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                      🌍 Lifestyle
                    </h3>
                  </div>
                  <div className="card-body space-y-4">
                    {displayUser.languages?.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-neutral-600 block mb-2">Languages:</span>
                        <div className="flex flex-wrap gap-2">
                          {displayUser.languages.map((language, index) => (
                            <span key={index} className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full text-sm">
                              {language}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {displayUser.foodPreferences?.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-neutral-600 block mb-2">Food Preferences:</span>
                        <div className="flex flex-wrap gap-2">
                          {displayUser.foodPreferences.map((food, index) => (
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
                <h2 className="text-xl font-semibold text-neutral-800">My Photos</h2>
              </div>
              <div className="card-body">
                {displayUser.photos && displayUser.photos.length > 0 ? (
                  <div className="grid grid-3 gap-4 mb-6">
                    {displayUser.photos.map(photo => (
                      <div key={photo.public_id} className="relative group">
                        <img 
                          src={photo.url} 
                          alt="Profile" 
                          className="w-full h-32 object-cover rounded-lg shadow-md" 
                        />
                        <button
                          onClick={() => handleDeletePhoto(photo.public_id)}
                          className="absolute top-2 right-2 bg-error text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete Photo"
                        >
                          ×
                        </button>
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
                    <p className="text-neutral-600 mb-4">No photos uploaded yet.</p>
                    <p className="text-sm text-neutral-500">Add some photos to make your profile more attractive!</p>
                  </div>
                )}
                
                <PhotoUpload onUploadSuccess={handleUploadSuccess} />
              </div>
            </div>

            {/* Edit Profile Section */}
            <div className="card animate-slide-up">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-neutral-800">Edit Profile</h2>
              </div>
              <div className="card-body">
                <ProfileEditForm 
                  currentUser={displayUser} 
                  onUpdate={(updatedUserData) => {
                    setProfileData(updatedUserData);
                    setAuthUser(updatedUserData);
                  }} 
                />
              </div>
            </div>

          </>
        ) : (
          <div className="text-center py-16">
            <div className="bg-error bg-opacity-10 border border-error text-error p-6 rounded-lg max-w-md mx-auto">
              <h3 className="font-semibold mb-2">Profile Not Found</h3>
              <p>Could not load profile data.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
