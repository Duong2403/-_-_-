import React, { useState, useRef } from 'react';
import api from '../services/api'; // Use our api instance

const PhotoUpload = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    setError(''); // Clear previous errors
    const file = event.target.files[0];
    if (file) {
      // Basic validation (can add more checks like size, type)
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        setSelectedFile(null);
        setPreviewUrl(null);
        event.target.value = null; // Clear the file input
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // Match backend limit (5MB)
         setError('File size exceeds 5MB limit.');
         setSelectedFile(null);
         setPreviewUrl(null);
         event.target.value = null; // Clear the file input
         return;
      }
      
      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
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
      
      // Clear everything after successful upload
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }

    } catch (err) {
      console.error('Photo upload error:', err.response ? err.response.data : err);
      setError(err.response?.data?.message || 'Photo upload failed. Please check your Cloudinary configuration.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  return (
    <div style={{ 
      border: '2px dashed #ccc', 
      borderRadius: '8px', 
      padding: '20px', 
      textAlign: 'center',
      marginTop: '20px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>Upload New Photo</h3>
      
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*" // Only allow image files
        onChange={handleFileChange}
        disabled={uploading}
        style={{ marginBottom: '15px' }}
      />
      
      {/* Preview */}
      {previewUrl && (
        <div style={{ margin: '15px 0' }}>
          <h4>Preview:</h4>
          <img 
            src={previewUrl} 
            alt="Preview" 
            style={{ 
              width: '150px', 
              height: '150px', 
              objectFit: 'cover', 
              borderRadius: '8px',
              border: '2px solid #ddd'
            }} 
          />
        </div>
      )}
      
      {/* Action Buttons */}
      <div style={{ marginTop: '15px' }}>
        <button 
          onClick={handleUpload} 
          disabled={!selectedFile || uploading}
          style={{
            backgroundColor: !selectedFile || uploading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: !selectedFile || uploading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </button>
        
        {selectedFile && !uploading && (
          <button 
            onClick={handleCancel}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        )}
      </div>
      
      {/* Error Message */}
      {error && (
        <div style={{ 
          color: 'red', 
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#ffe6e6',
          borderRadius: '5px',
          border: '1px solid #ff9999'
        }}>
          {error}
        </div>
      )}
      
      {/* Upload Instructions */}
      <div style={{ 
        marginTop: '15px', 
        fontSize: '14px', 
        color: '#666' 
      }}>
        <p>• Supported formats: JPG, PNG, GIF</p>
        <p>• Maximum file size: 5MB</p>
        <p>• Recommended size: 500x500px or larger</p>
      </div>
    </div>
  );
};

export default PhotoUpload;
