// Real Email Server for Fliptrade Admin Panel
const express = require('express');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// SMTP Configuration from environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtpout.secureserver.net',
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: process.env.EMAIL_SECURE === 'true' || true,
  auth: {
    user: process.env.EMAIL_USER || 'help@fliptradegroup.com',
    pass: process.env.EMAIL_PASSWORD || 'Fortuner52@@'
  }
});

// Supabase (service role) - used for Auth emails (invite, recovery)
const supa = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Admin routes will fail.');
}

// Test email connection
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Email connection failed:', error);
  } else {
    console.log('✅ Email server ready to send messages');
  }
});

// Send Welcome Email API
app.post('/api/send-welcome-email', async (req, res) => {
  try {
    const { email, staffName, tempPassword } = req.body;
    
    console.log('📧 Sending welcome email to:', email);
    console.log('📧 Staff Name:', staffName);
    console.log('📧 Temporary Password:', tempPassword);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'help@fliptradegroup.com',
      to: email,
      subject: 'Welcome to Fliptrade Admin Panel - Account Setup',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Fliptrade Admin Panel!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${staffName},</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">Your account has been created successfully. Please use the following temporary password to sign in:</p>
            
            <div style="background: #e3f2fd; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; border: 2px solid #2196f3;">
              <h1 style="color: #1976d2; font-size: 32px; margin: 0; letter-spacing: 4px; font-family: monospace;">${tempPassword}</h1>
            </div>
          </div>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 25px;">
            <h3 style="color: #856404; margin-top: 0;">Important Instructions:</h3>
            <ul style="color: #856404; margin: 0; padding-left: 20px;">
              <li>Please change your password after first login</li>
              <li>Keep your password secure and confidential</li>
              <li>If you didn't request this account, please contact support immediately</li>
            </ul>
          </div>
          
          <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <p style="color: #666; margin: 0;">Best regards,<br><strong>Fliptrade Admin Team</strong></p>
            <p style="color: #999; font-size: 12px; margin-top: 15px;">This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent successfully:', result.messageId);
    
    res.json({ 
      success: true, 
      message: 'Welcome email sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send welcome email',
      error: error.message
    });
  }
});

// Supabase: Invite user by email (uses your Supabase SMTP settings)
app.post('/api/supabase/invite', async (req, res) => {
  try {
    const { email, name, tempPassword } = req.body;
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ success: false, message: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });
    }
    const { data, error } = await supa.auth.admin.inviteUserByEmail(email, {
      data: { name },
      password: tempPassword,
    });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Supabase invite error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update staff status (active/inactive) and optionally invalidate sessions
app.post('/api/staff/update-status', async (req, res) => {
  try {
    const { staffId, status } = req.body;

    if (!staffId || !status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid staffId or status' });
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ success: false, message: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });
    }

    const { data, error } = await supa
      .from('staff')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', staffId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating staff status in database:', error);
      return res.status(500).json({ success: false, message: error.message });
    }

    let sessionResult = null;
    if (status === 'inactive') {
      try {
        sessionResult = await supa.auth.admin.invalidateUserSessions(staffId);
        console.log('✅ Invalidated user sessions for staff:', staffId);
      } catch (sessionError) {
        console.error('⚠️ Failed to invalidate user sessions:', sessionError);
      }
    }

    res.json({ success: true, data, sessionResult });
  } catch (error) {
    console.error('❌ Error in staff status endpoint:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create or update staff permissions using service role
app.post('/api/staff/permissions', async (req, res) => {
  try {
    const { permissions } = req.body;

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({ success: false, message: 'Permissions payload is required' });
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ success: false, message: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });
    }

    const allowedModules = new Set(['dashboard', 'deposits', 'bankDeposits', 'staffManagement', 'activityLogs']);

    const sanitized = permissions
      .filter((perm) => perm && allowedModules.has(perm.module))
      .map((perm) => ({
        id: perm.id || perm.permission_id || perm.permissionId || crypto.randomUUID(),
        staff_id: perm.staff_id,
        module: perm.module,
        can_view: !!perm.can_view,
        can_add: !!perm.can_add,
        can_edit: !!perm.can_edit,
        can_delete: !!perm.can_delete,
        updated_at: new Date().toISOString(),
      }));

    if (sanitized.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid permissions provided' });
    }

    const { data, error } = await supa
      .from('staff_permissions')
      .upsert(sanitized, { onConflict: 'staff_id,module', ignoreDuplicates: false })
      .select();

    if (error) {
      console.error('❌ Error creating staff permissions:', error);
      return res.status(500).json({ success: false, message: error.message });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Exception in staff permissions endpoint:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Supabase: Send password recovery email
app.post('/api/supabase/recover', async (req, res) => {
  try {
    const { email, redirectTo } = req.body;
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ success: false, message: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });
    }
    const { data, error } = await supa.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || 'http://localhost:3000',
    });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Supabase recovery error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send Password Reset OTP API
app.post('/api/send-password-reset-otp', async (req, res) => {
  try {
    const { email, staffName, otp } = req.body;
    
    console.log('📧 Sending password reset OTP to:', email);
    console.log('📧 OTP Code:', otp);
    console.log('📧 Staff Name:', staffName);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'help@fliptradegroup.com',
      to: email,
      subject: 'Password Reset - Fliptrade Admin Panel',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${staffName},</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">You have requested to reset your password. Please use the following OTP to proceed:</p>
            
            <div style="background: #ffebee; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; border: 2px solid #f44336;">
              <h1 style="color: #d32f2f; font-size: 32px; margin: 0; letter-spacing: 4px; font-family: monospace;">${otp}</h1>
            </div>
          </div>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 25px;">
            <h3 style="color: #856404; margin-top: 0;">Security Notice:</h3>
            <ul style="color: #856404; margin: 0; padding-left: 20px;">
              <li>This OTP is valid for 10 minutes only</li>
              <li>Do not share this OTP with anyone</li>
              <li>If you didn't request this reset, please contact support immediately</li>
            </ul>
          </div>
          
          <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <p style="color: #666; margin: 0;">Best regards,<br><strong>Fliptrade Admin Team</strong></p>
            <p style="color: #999; font-size: 12px; margin-top: 15px;">This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset OTP sent successfully:', result.messageId);
    
    res.json({ 
      success: true, 
      message: 'Password reset OTP sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    console.error('❌ Error sending password reset OTP:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send password reset OTP',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Email service is running',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Email server running on port ${PORT}`);
  console.log(`📧 SMTP Host: ${process.env.EMAIL_HOST || 'smtpout.secureserver.net'}`);
  console.log(`📧 SMTP User: ${process.env.EMAIL_USER || 'help@fliptradegroup.com'}`);
});
