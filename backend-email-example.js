// Backend API Example for Real SMTP Email Sending
// This would be a separate Node.js backend server

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// SMTP Configuration from environment variables
const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST || 'smtpout.secureserver.net',
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: process.env.EMAIL_SECURE === 'true' || true,
  auth: {
    user: process.env.EMAIL_USER || 'help@fliptradegroup.com',
    pass: process.env.EMAIL_PASSWORD || 'Fortuner52@@'
  }
});

// Send Welcome Email API
app.post('/api/send-welcome-email', async (req, res) => {
  try {
    const { email, staffName, tempPassword } = req.body;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'help@fliptradegroup.com',
      to: email,
      subject: 'Welcome to Fliptrade Admin Panel - Account Setup',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to Fliptrade Admin Panel!</h2>
          <p>Hello ${staffName},</p>
          <p>Your account has been created successfully. Please use the following temporary password to sign in:</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: 4px;">${tempPassword}</h1>
          </div>
          
          <p><strong>Important:</strong></p>
          <ul>
            <li>Please change your password after first login</li>
            <li>Keep your password secure</li>
            <li>If you didn't request this, please contact support immediately</li>
          </ul>
          
          <p>Best regards,<br>Fliptrade Admin Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Welcome email sent successfully' });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({ success: false, message: 'Failed to send welcome email' });
  }
});

// Send Password Reset OTP API
app.post('/api/send-password-reset-otp', async (req, res) => {
  try {
    const { email, staffName, otp } = req.body;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'help@fliptradegroup.com',
      to: email,
      subject: 'Password Reset - Fliptrade Admin Panel',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Password Reset Request</h2>
          <p>Hello ${staffName},</p>
          <p>You have requested to reset your password. Please use the following OTP to proceed:</p>
          
          <div style="background-color: #fef2f2; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; border: 2px solid #fecaca;">
            <h1 style="color: #dc2626; font-size: 32px; margin: 0; letter-spacing: 4px;">${otp}</h1>
          </div>
          
          <p><strong>Security Notice:</strong></p>
          <ul>
            <li>This OTP is valid for 10 minutes only</li>
            <li>Do not share this OTP with anyone</li>
            <li>If you didn't request this reset, please contact support immediately</li>
          </ul>
          
          <p>Best regards,<br>Fliptrade Admin Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Password reset OTP sent successfully' });
  } catch (error) {
    console.error('Error sending password reset OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to send password reset OTP' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Email service running on port ${PORT}`);
});
