const nodemailer = require('nodemailer');

let transporter = null;

// Initialize Nodemailer Transport
const getTransporter = async () => {
  if (transporter) return transporter;

  // 1. If custom SMTP environment variables are set, use them
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log('[Email Service] Configured with production SMTP host:', process.env.SMTP_HOST);
  } else {
    // 2. Auto-generate test account using Ethereal Email for instant testing
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('[Email Service] Created Ethereal SMTP testing account:', testAccount.user);
    } catch (err) {
      console.warn('[Email Service] Fallback transporter warning:', err.message);
      transporter = nodemailer.createTransport({
        jsonTransport: true
      });
    }
  }

  return transporter;
};

// Send OTP Verification Email
const sendOTPEmail = async (recipientEmail, otpCode, userName = 'Valued User', userRole = 'PATIENT') => {
  try {
    const mailTransporter = await getTransporter();

    const fromAddress = process.env.SMTP_FROM || '"JIVEXA Health OS" <no-reply@jivexa.health>';
    const roleLabels = {
      PATIENT: 'Patient Health Vault',
      DOCTOR: 'Practitioner Medical Portal',
      AMBULANCE_PARTNER: '24/7 Emergency Dispatch Fleet',
      PHARMACY: 'Licensed Pharmacy Fulfillment Hub',
      ADMIN: 'System Administration'
    };

    const roleName = roleLabels[userRole] || 'User Profile';

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; border-radius: 20px; background-color: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0284c7; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">JIVEXA HEALTH OS</h2>
          <p style="color: #0f766e; font-size: 13px; font-weight: 700; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em;">${roleName} Verification</p>
        </div>

        <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px; border: 1px solid #f1f5f9;">
          <p style="color: #1e293b; font-size: 16px; margin-top: 0;">Hello <strong>${userName}</strong>,</p>
          <p style="color: #64748b; font-size: 14px; line-height: 1.5;">To verify ownership of this email address and activate your JIVEXA Health account, enter the following 6-digit security code:</p>
          
          <div style="background: linear-gradient(135deg, #0284c7 0%, #0f766e 100%); color: #ffffff; font-size: 36px; font-weight: 900; letter-spacing: 12px; padding: 16px 24px; border-radius: 14px; display: inline-block; margin: 18px 0; text-align: center; box-shadow: 0 8px 20px -4px rgba(2, 132, 199, 0.4);">
            ${otpCode}
          </div>
          
          <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">This code expires in <strong>10 minutes</strong>. Do not share this code with anyone.</p>
        </div>

        <div style="text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 18px;">
          <p style="margin: 0;">If you did not initiate account creation on JIVEXA Health, please ignore this email.</p>
          <p style="margin-top: 6px; font-weight: 600;">© ${new Date().getFullYear()} JIVEXA Health OS • Secure Identity Verification</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: fromAddress,
      to: recipientEmail,
      subject: `[${otpCode}] Your JIVEXA Health Verification Code`,
      text: `Hello ${userName}, your JIVEXA Health verification code is ${otpCode}. It is valid for 10 minutes.`,
      html: htmlContent
    };

    const info = await mailTransporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info) || null;

    console.log(`\n======================================================`);
    console.log(`[EMAIL DISPATCHED] To: ${recipientEmail} (${userRole})`);
    console.log(`[OTP VERIFICATION CODE]: ${otpCode}`);
    if (previewUrl) {
      console.log(`[LIVE ETHERAEAL PREVIEW URL]: ${previewUrl}`);
    }
    console.log(`======================================================\n`);

    return {
      success: true,
      messageId: info.messageId,
      previewUrl
    };
  } catch (error) {
    console.error('[Email Service Error]:', error);
    return {
      success: false,
      error: error.message || 'Failed to dispatch email'
    };
  }
};

module.exports = {
  sendOTPEmail
};
