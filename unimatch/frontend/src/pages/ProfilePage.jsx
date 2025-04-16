import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api'; // Import the api instance
import PhotoUpload from '../components/PhotoUpload'; // Import the component
import ProfileEditForm from '../components/ProfileEditForm'; // Import the component


const ProfilePage = () => {
  const { user: authUser, loading: authLoading, setUser: setAuthUser } = useAuth(); // Get user from auth context
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    return <div>Loading Profile...</div>;
  }

  // Display error message if fetch failed
  if (error) {
      return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  // Display message if not authenticated (shouldn't happen with ProtectedRoute, but good fallback)
   if (!profileData && !authUser) {
     return <div>Please log in to view your profile.</div>;
   }

  // Use profileData if available, otherwise fallback to authUser (might be slightly stale)
  const displayUser = profileData || authUser;

  return (
    <div>
      <h1>User Profile</h1>
      {displayUser ? (
        <div>
          <p><strong>Name:</strong> {displayUser.name}</p>
          <p><strong>Email:</strong> {displayUser.email}</p>
          <p><strong>Age:</strong> {displayUser.age}</p>
          <p><strong>University:</strong> {displayUser.university}</p>
          <p><strong>Bio:</strong> {displayUser.bio || 'Not set'}</p>

          <h2>Photos</h2>
          {displayUser.photos && displayUser.photos.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {displayUser.photos.map(photo => (
                <div key={photo.public_id} style={{ position: 'relative', marginRight: '10px', marginBottom: '10px' }}>
                  <img src={photo.url} alt="User profile" style={{ width: '100px', height: '100px', objectFit: 'cover', display: 'block' }} />
                  <button
                    onClick={() => handleDeletePhoto(photo.public_id)}
                    style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer', padding: '2px 4px', fontSize: '10px' }}
                    title="Delete Photo"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>No photos uploaded yet.</p>
          )}

          {/* Add PhotoUpload component */}
          <PhotoUpload onUploadSuccess={handleUploadSuccess} />

          <hr style={{ margin: '20px 0' }}/>

          {/* Add ProfileEditForm component */}
          <ProfileEditForm currentUser={displayUser} onUpdate={(updatedUserData) => {
              setProfileData(updatedUserData); // Update local state
              setAuthUser(updatedUserData); // Update auth context state
          }} />

        </div>
      ) : (
         <p>Could not load profile data.</p> // Should ideally be caught by loading/error states
      )}
    </div>
  );

  // Function to handle successful photo upload
  function handleUploadSuccess(newPhoto) {
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
  }

   // Function to handle photo deletion
  async function handleDeletePhoto(publicId) {
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
  }

};

export default ProfilePage;
