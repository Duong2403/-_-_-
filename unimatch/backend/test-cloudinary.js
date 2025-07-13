const cloudinary = require('./config/cloudinaryConfig');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function testCloudinaryConnection() {
    console.log('Testing Cloudinary Configuration...\n');

    // Check if environment variables are set
    console.log('Environment Variables:');
    console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✓ Set' : '✗ Not set');
    console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Not set');
    console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Not set');
    console.log('');

    // Check if they are placeholder values
    if (process.env.CLOUDINARY_CLOUD_NAME === 'your_cloudinary_cloud_name' ||
        process.env.CLOUDINARY_API_KEY === 'your_cloudinary_api_key' ||
        process.env.CLOUDINARY_API_SECRET === 'your_cloudinary_api_secret') {
        console.log('❌ ERROR: Cloudinary credentials are still using placeholder values!');
        console.log('Please update your .env file with actual Cloudinary credentials.');
        console.log('See setup-cloudinary.md for instructions.');
        return;
    }

    try {
        // Test API connection
        console.log('Testing API connection...');
        const result = await cloudinary.api.ping();
        console.log('✅ Cloudinary API connection successful!');
        console.log('Status:', result.status);
        
        // Test basic upload (using a simple data URL)
        console.log('\nTesting upload capability...');
        const testUpload = await cloudinary.uploader.upload(
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            {
                folder: 'unimatch/test',
                public_id: 'test_upload_' + Date.now()
            }
        );
        console.log('✅ Test upload successful!');
        console.log('Upload URL:', testUpload.secure_url);
        
        // Clean up test upload
        await cloudinary.uploader.destroy(testUpload.public_id);
        console.log('✅ Test cleanup successful!');
        
        console.log('\n🎉 Cloudinary is properly configured and ready to use!');
        
    } catch (error) {
        console.log('❌ Cloudinary test failed:');
        console.error('Error:', error);
        
        if (error && error.message) {
            if (error.message.includes('Invalid cloud_name')) {
                console.log('\n💡 Solution: Check your CLOUDINARY_CLOUD_NAME in .env file');
            } else if (error.message.includes('Invalid API key')) {
                console.log('\n💡 Solution: Check your CLOUDINARY_API_KEY in .env file');
            } else if (error.message.includes('Invalid API secret')) {
                console.log('\n💡 Solution: Check your CLOUDINARY_API_SECRET in .env file');
            } else {
                console.log('\n💡 Please check your Cloudinary credentials and network connection');
                console.log('Error details:', error.message);
            }
        } else {
            console.log('\n💡 Unknown error occurred. Please check your Cloudinary credentials and network connection');
            console.log('Error details:', error);
        }
    }
}

// Run the test
testCloudinaryConnection(); 