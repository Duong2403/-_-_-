import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ProfileEditForm = ({ currentUser, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Populate form when currentUser data is available
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        bio: currentUser.bio || '',
      });
    }
  }, [currentUser]);

  const { name, bio } = formData;

  const onChange = (e) => {
     setFormData({ ...formData, [e.target.name]: e.target.value });
     setError(''); // Clear error on change
     setSuccess(''); // Clear success on change
  }


  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.put('/users/me', { name, bio });
      setLoading(false);
      setSuccess('Profile updated successfully!');
      onUpdate(res.data); // Pass updated user data back to parent
    } catch (err) {
      console.error('Profile update error:', err.response ? err.response.data : err);
      setError(err.response?.data?.message || 'Failed to update profile.');
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Edit Profile</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="name">Name: </label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={onChange}
            required
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="bio">Bio: </label>
          <textarea
            id="bio"
            name="bio"
            value={bio}
            onChange={onChange}
            rows="4"
            maxLength="500"
            style={{ width: '100%', maxWidth: '400px' }}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default ProfileEditForm;
