# Gmail Invitation Setup Guide

This guide explains how to set up Gmail functionality for sending team invitations.

## Prerequisites

1. A Gmail account
2. Gmail App Password (not your regular password)
3. Environment variables configured

## Step 1: Enable 2-Factor Authentication

1. Go to your Google Account settings
2. Navigate to "Security"
3. Enable "2-Step Verification" if not already enabled

## Step 2: Create Gmail App Password

1. Go to Google Account settings → Security
2. Under "2-Step Verification", click on "App passwords"
3. Select "Mail" and your device
4. Copy the generated 16-character password

## Step 3: Set Environment Variables

Create a `.env` file in the backend directory with:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
FRONTEND_URL=http://localhost:3000
```

## Step 4: Test the Setup

Run the test script to verify everything works:

```bash
cd unimatch/backend
node test-gmail-invitation.js
```

## Troubleshooting

### Error: "Email service disabled"
- Check that `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set in your `.env` file
- Ensure the `.env` file is in the `backend` directory

### Error: "Invalid login"
- Make sure you're using an App Password, not your regular Gmail password
- Verify 2-Factor Authentication is enabled on your Google account

### Error: "Authentication failed"
- Double-check the App Password is correct (no spaces)
- Try generating a new App Password

## Email Template Features

The invitation emails include:
- Professional styling with gradients and colors
- Responsive design for mobile devices
- Clear call-to-action buttons
- Different templates for existing users vs. new users
- University-specific branding

## Security Notes

- App Passwords are safer than regular passwords
- Never commit your `.env` file to version control
- Use different App Passwords for different applications
- Regularly rotate your App Passwords

## Production Deployment

For production, set these environment variables on your server:
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- `FRONTEND_URL` (your production domain)

Example for Heroku:
```bash
heroku config:set GMAIL_USER=your-email@gmail.com
heroku config:set GMAIL_APP_PASSWORD=your-app-password
heroku config:set FRONTEND_URL=https://your-domain.com
``` 