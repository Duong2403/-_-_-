import React, { useState } from 'react';
import api from '../services/api'; // Use our api instance

const PhotoUpload = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    setError(''); // Clear previous errors
    const file = event.target.files[0];
    if (file) {
      // Basic validation (can add more checks like size, type)
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        setSelectedFile(null);
        event.target.value = null; // Clear the file input
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // Match backend limit (5MB)
         setError('File size exceeds 5MB limit.');
         setSelectedFile(null);
         event.target.value = null; // Clear the file input
         return;
      }
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a photo to upload.');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('photo', selectedFile); // 'photo' must match the field name expected by multer on backend

    try {
      const res = await api.post('/users/me/photos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Important for file uploads
        },
      });
      console.log('Upload successful:', res.data);
      onUploadSuccess(res.data); // Pass the new photo data back to parent
      setSelectedFile(null); // Clear selection
      // Clear the file input visually (requires accessing the input element, maybe via ref)
      document.getElementById('photo-upload-input').value = null;


    } catch (err) {
      console.error('Photo upload error:', err.response ? err.response.data : err);
      setError(err.response?.data?.message || 'Photo upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h3>Upload New Photo</h3>
      <input
        id="photo-upload-input"
        type="file"
        accept="image/*" // Only allow image files
        onChange={handleFileChange}
        disabled={uploading}
      />
      <button onClick={handleUpload} disabled={!selectedFile || uploading}>
        {uploading ? 'Uploading...' : 'Upload Photo'}
      </button>
      {error && <p style={{ color: 'red', marginTop: '5px' }}>{error}</p>}
    </div>
  );
};

export default PhotoUpload;
