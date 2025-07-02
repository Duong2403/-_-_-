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
          await api.delete(`/users/me/photos/${publicId}`);
          // Update state after successful deletion
          const updatedPhotos = profileData.photos.filter(p => p.public_id !== publicId);
          setProfileData(prevData => ({ ...prevData, photos: updatedPhotos }));
          setAuthUser(prevData => ({ ...prevData, photos: updatedPhotos }));
      } catch (err) {
          console.error("Error deleting photo:", err);
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
                    <div className="flex items-center gap-2">
                      <span className="badge badge-primary">{displayUser.university}</span>
                      {displayUser.age && <span className="badge badge-outline">Age {displayUser.age}</span>}
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
