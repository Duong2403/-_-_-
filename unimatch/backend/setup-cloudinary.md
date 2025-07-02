# Cloudinary Setup Guide for Photo Upload

## Step 1: Create a Cloudinary Account
1. Go to [https://cloudinary.com/](https://cloudinary.com/)
2. Sign up for a free account
3. After registration, go to your Dashboard

## Step 2: Get Your Credentials
From your Cloudinary Dashboard, copy:
- **Cloud Name** (e.g., `your-cloud-name`)
- **API Key** (e.g., `123456789012345`)
- **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

## Step 3: Update .env File
Replace the placeholder values in your `.env` file:

```env
CLOUDINARY_CLOUD_NAME=your-actual-cloud-name
CLOUDINARY_API_KEY=your-actual-api-key
CLOUDINARY_API_SECRET=your-actual-api-secret
```

## Step 4: Restart the Backend Server
After updating the .env file:
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Step 5: Test Photo Upload
1. Go to your profile page in the frontend
2. Try uploading an image
3. Check if it appears in your Cloudinary Media Library

## Troubleshooting
- **"Photo upload failed"**: Check your Cloudinary credentials
- **"Invalid credentials"**: Verify your API key and secret
- **"Cloud name not found"**: Check your cloud name spelling

## Free Tier Limits
- 25 GB storage
- 25 GB monthly bandwidth
- 1,000 transformations per month

This should be sufficient for development and testing. 