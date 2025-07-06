import React, { useState, useRef } from 'react';
import { AttachmentIcon } from '../ui/SocialIcons';

const ImageUpload = ({ onImageSelect, onUpload, isUploading = false, uploadProgress = 0 }) => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }

            // Validate file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                return;
            }

            setSelectedImage(file);
            
            // Create preview URL
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            
            if (onImageSelect) {
                onImageSelect(file);
            }
        }
    };

    const handleUpload = () => {
        if (selectedImage && onUpload) {
            onUpload(selectedImage);
            // Clear the selected image after upload starts
            handleCancel();
        }
    };

    const handleCancel = () => {
        setSelectedImage(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    return (
        <>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Upload button */}
            {!selectedImage && (
                <button
                    type="button"
                    onClick={triggerFileSelect}
                    className="p-2 text-neutral-500 hover:text-primary-rose hover:bg-primary-rose hover:bg-opacity-10 rounded-lg transition-colors"
                    title="Upload image"
                    disabled={isUploading}
                >
                    <AttachmentIcon size={18} />
                </button>
            )}

            {/* Image preview modal */}
            {selectedImage && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Send Image</h3>
                        
                        {/* Image preview */}
                        <div className="mb-4">
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-full h-48 object-cover rounded-lg border border-neutral-200"
                            />
                        </div>

                        {/* File info */}
                        <div className="mb-4 text-sm text-neutral-600">
                            <p><strong>File:</strong> {selectedImage.name}</p>
                            <p><strong>Size:</strong> {(selectedImage.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>

                        {/* Upload progress */}
                        {isUploading && (
                            <div className="mb-4">
                                <div className="flex justify-between text-sm text-neutral-600 mb-1">
                                    <span>Uploading...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div className="w-full bg-neutral-200 rounded-full h-2">
                                    <div 
                                        className="bg-primary-rose h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancel}
                                className="flex-1 px-4 py-2 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                                disabled={isUploading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                className="flex-1 px-4 py-2 bg-primary-rose text-white hover:bg-primary-rose-dark rounded-lg transition-colors disabled:opacity-50"
                                disabled={isUploading}
                            >
                                {isUploading ? 'Uploading...' : 'Send Image'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ImageUpload; 