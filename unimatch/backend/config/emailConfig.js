const nodemailer = require('nodemailer');

// Gmail SMTP configuration
const createEmailTransporter = () => {
  // Check if environment variables are set
  const requiredEnvVars = ['GMAIL_USER', 'GMAIL_APP_PASSWORD'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`⚠️ Email service disabled: Missing environment variables: ${missingVars.join(', ')}`);
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD // Use App Password, not regular password
      }
    });

    console.log('✅ Email service configured successfully');
    return transporter;
  } catch (error) {
    console.error('❌ Error configuring email service:', error);
    return null;
  }
};

// Email templates
const createInvitationEmailTemplate = (inviterName, teamName, inviteeEmail, isExternalInvite = false) => {
  const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  if (isExternalInvite) {
    // For users who don't have accounts yet
    return {
      subject: `Join "${teamName}" team - UniMatch Invitation`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🎉 You're Invited!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; color: #333; margin-bottom: 20px;">
              Hi there! 👋
            </p>
            
            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 25px;">
              <strong>${inviterName}</strong> has invited you to join their team <strong>"${teamName}"</strong> on UniMatch - 
              the platform for university students to form groups and connect with like-minded peers!
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 25px 0;">
              <h3 style="color: #667eea; margin-top: 0;">What is UniMatch?</h3>
              <p style="color: #666; margin-bottom: 0;">
                UniMatch helps university students create teams, find study partners, make friends, 
                and discover others with similar interests. Join thousands of students already connecting!
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${appUrl}/register?email=${encodeURIComponent(inviteeEmail)}&ref=invitation" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; font-size: 16px;">
                Create Account & Join Team
              </a>
            </div>
            
            <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
              If you're already a member, you can <a href="${appUrl}/login" style="color: #667eea;">sign in here</a> and check your invitations.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
            <p>This invitation was sent via UniMatch. If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </div>
      `
    };
  } else {
    // For existing users
    return {
      subject: `Join "${teamName}" team - UniMatch`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Team Invitation</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; color: #333; margin-bottom: 20px;">
              Hi! 👋
            </p>
            
            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 25px;">
              <strong>${inviterName}</strong> has invited you to join their team <strong>"${teamName}"</strong> on UniMatch!
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 25px 0;">
              <p style="color: #666; margin-bottom: 0;">
                You can accept or decline this invitation by logging into your UniMatch account and checking your pending invitations.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${appUrl}/login" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; font-size: 16px;">
                View Invitation
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
            <p>This invitation was sent via UniMatch. If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </div>
      `
    };
  }
};

// Dummy sendInvitationEmail function (no email sent)
const sendInvitationEmail = async (inviterName, teamName, inviteeEmail, isExternalInvite = false) => {
  console.log(`[DUMMY] Would send invitation email to ${inviteeEmail} for team ${teamName}`);
  return { success: true, messageId: 'dummy' };
};

// Dummy sendJoinRequestNotificationEmail function (no email sent)
const sendJoinRequestNotificationEmail = async (applicantName, teamName, teamCreatorEmail) => {
  console.log(`[DUMMY] Would send join request notification email to ${teamCreatorEmail} for team ${teamName}`);
  return { success: true, messageId: 'dummy' };
};

module.exports = {
  sendInvitationEmail,
  sendJoinRequestNotificationEmail
}; 