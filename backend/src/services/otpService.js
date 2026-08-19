const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Security Configuration
const OTP_EXPIRATION_MINUTES = 5; // Strict 5-minute expiry per healthcare brief
const OTP_MAX_ATTEMPTS = 5; // Max 5 verification attempts
const OTP_RESEND_COOLDOWN_SECONDS = 45;

/**
 * Generate a cryptographically secure 6-digit numeric OTP string using crypto module
 */
const generate6DigitOTP = () => {
  // Use crypto.randomInt for cryptographically secure random number generation (never Math.random)
  const num = crypto.randomInt(100000, 999999);
  return num.toString();
};

/**
 * Generate prefix-based unique distinguishable role ID
 * - Patient: PAT-202608-X8491
 * - Doctor: DOC-202608-X9920
 * - Ambulance: AMB-202608-X3149
 * - Pharmacy: PHR-202608-X7721
 */
const generateRoleId = (role) => {
  const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  
  const prefixMap = {
    PATIENT: 'PAT',
    DOCTOR: 'DOC',
    AMBULANCE_PARTNER: 'AMB',
    PHARMACY: 'PHR',
    ADMIN: 'ADM'
  };

  const prefix = prefixMap[role] || 'JXV';
  return `${prefix}-${dateStr}-${randomSuffix}`;
};

/**
 * Create OTP metadata object for saving in User database model
 * Scoped by purpose: 'signup_verification' | 'login_2fa' | 'password_reset'
 */
const createOTPEntry = async (purpose = 'signup_verification') => {
  const plainOtp = generate6DigitOTP();
  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(plainOtp, salt);

  const now = Date.now();
  const expiresAt = new Date(now + OTP_EXPIRATION_MINUTES * 60 * 1000);
  const resendAvailableAt = new Date(now + OTP_RESEND_COOLDOWN_SECONDS * 1000);

  return {
    plainOtp,
    otpHash,
    purpose,
    expiresAt,
    resendAvailableAt,
    attempts: 0
  };
};

/**
 * Verify input OTP code against stored OTP metadata with timing-safe comparison
 */
const verifyOTPEntry = async (storedOtpMeta, enteredCode, expectedPurpose = 'signup_verification') => {
  if (!storedOtpMeta || !storedOtpMeta.codeHash) {
    return {
      valid: false,
      reason: 'NO_OTP_RECORD',
      message: 'No pending verification OTP record found. Please request a new code.'
    };
  }

  // 1. Validate Scope / Purpose
  if (storedOtpMeta.purpose && storedOtpMeta.purpose !== expectedPurpose) {
    return {
      valid: false,
      reason: 'SCOPE_MISMATCH',
      message: 'Security validation error: OTP was not issued for this verification action.'
    };
  }

  // 2. Check Expiration Window (5 mins)
  if (new Date() > new Date(storedOtpMeta.expiresAt)) {
    return {
      valid: false,
      reason: 'EXPIRED',
      message: 'Verification OTP code has expired. Please click Resend OTP for a new code.'
    };
  }

  // 3. Check Maximum Attempts Limit
  if (storedOtpMeta.attempts >= OTP_MAX_ATTEMPTS) {
    return {
      valid: false,
      reason: 'MAX_ATTEMPTS_EXCEEDED',
      message: 'Maximum verification attempts exceeded. Please request a new OTP code.'
    };
  }

  // 4. Compare Entered Code against stored bcrypt Hash
  const isMatch = await bcrypt.compare(enteredCode.trim(), storedOtpMeta.codeHash);
  if (!isMatch) {
    return {
      valid: false,
      reason: 'INVALID_CODE',
      attemptsRemaining: OTP_MAX_ATTEMPTS - (storedOtpMeta.attempts + 1),
      message: `Invalid 6-digit verification code. ${OTP_MAX_ATTEMPTS - (storedOtpMeta.attempts + 1)} attempts remaining.`
    };
  }

  return {
    valid: true,
    message: 'OTP verified successfully.'
  };
};

/**
 * Helper to mask an email address e.g. "doctor@example.com" -> "d***r@example.com"
 */
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
};

module.exports = {
  generate6DigitOTP,
  generateRoleId,
  createOTPEntry,
  verifyOTPEntry,
  maskEmail,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_EXPIRATION_MINUTES,
  OTP_MAX_ATTEMPTS
};
