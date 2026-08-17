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
      // Fallback dummy transporter
      transporter = nodemailer.createTransport({
        jsonTransport: true
      });
    }
  }

  return transporter;
};

// Send OTP Verification Email
const sendOTPEmail = async (recipientEmail, otpCode, userName = 'Valued User') => {
  try {
    const mailTransporter = await getTransporter();

    const fromAddress = process.env.SMTP_FROM || '"JIVEXA Health OS" <no-reply@jivexa.health>';

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; border-radius: 16px; background-color: #ffffff; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0284c7; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">JIVEXA Health OS</h2>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Security & Account Verification</p>
        </div>

        <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #334155; font-size: 15px; margin-top: 0;">Hello <strong>${userName}</strong>,</p>
          <p style="color: #64748b; font-size: 14px; line-height: 1.5;">Your 6-digit verification code to complete your JIVEXA profile sign-in is:</p>
          
          <div style="background-color: #0284c7; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: 10px; padding: 14px 20px; border-radius: 10px; display: inline-block; margin: 16px 0; text-align: center;">
            ${otpCode}
          </div>
          
          <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">This code is valid for <strong>10 minutes</strong>. Please do not share this code with anyone.</p>
        </div>

        <div style="text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          <p style="margin: 0;">If you did not request this email, you can safely ignore it.</p>
          <p style="margin-top: 4px;">© ${new Date().getFullYear()} JIVEXA Health OS. All rights reserved.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: fromAddress,
      to: recipientEmail,
      subject: `${otpCode} is your JIVEXA Health verification code`,
      text: `Hello ${userName}, your JIVEXA Health verification code is ${otpCode}. It is valid for 10 minutes.`,
      html: htmlContent
    };

    const info = await mailTransporter.sendMail(mailOptions);

    console.log(`\n======================================================`);
    console.log(`[EMAIL DISPATCHED] To: ${recipientEmail}`);
    console.log(`[OTP CODE]: ${otpCode}`);
    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`[LIVE ETHERAEAL PREVIEW URL]: ${nodemailer.getTestMessageUrl(info)}`);
    }
    console.log(`======================================================\n`);

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info) || null
    };
  } catch (error) {
    console.error('[Email Dispatch Error]:', error);
    return {
      success: false,
      error: error.message || 'Failed to dispatch email'
    };
  }
};

module.exports = {
  sendOTPEmail
};
