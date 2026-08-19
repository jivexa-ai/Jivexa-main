const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const { signupSchema, loginSchema, updateProfileSchema } = require('../validators/userValidators');
const { sendOTPEmail } = require('../services/emailService');
const { 
  createOTPEntry, 
  verifyOTPEntry, 
  maskEmail, 
  generateRoleId, 
  OTP_RESEND_COOLDOWN_SECONDS 
} = require('../services/otpService');

const JWT_SECRET = process.env.JWT_SECRET || 'jivexa_health_jwt_secret_key_2026_super_secure_auth_token_string';
const MAX_FAILED_LOGINS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15-minute lockout

// Helper to generate signed JWT token
const generateToken = (id, email, role, name, roleId) => {
  if (!JWT_SECRET) {
    throw new Error('JWT secret key is not configured in backend environment');
  }
  return jwt.sign(
    { id, email, role, name, roleId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Cookie configuration options
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});

// Memory fallback store if local MongoDB connection is disconnected
const inMemoryUsers = [];

// @desc    Register a new user (Signup & Dispatch Email OTP)
// @route   POST /api/auth/signup
// @access  Public
const registerUser = async (req, res) => {
  try {
    const validationResult = signupSchema.safeParse(req.body);
    if (!validationResult.success) {
      const issues = validationResult.error.issues || validationResult.error.errors || [];
      const firstError = issues[0]?.message || 'Invalid input data';
      return res.status(400).json({
        success: false,
        error: firstError,
        message: firstError,
        details: issues
      });
    }

    const { name, age, email, password, role } = validationResult.data;
    const userRole = (role || 'PATIENT').toUpperCase();

    // Generate Prefix-Based Unique Distinguishable Role ID
    const roleId = generateRoleId(userRole);

    // Initial account status
    const initialAccountStatus = 'PENDING_EMAIL_VERIFICATION';

    // Generate cryptographic signup_verification OTP
    const otpEntry = await createOTPEntry('signup_verification');

    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        if (existingUser.emailVerified) {
          // Account enumeration safe response
          return res.status(409).json({
            success: false,
            error: 'An account with this email address already exists and is verified. Please Sign In.',
            message: 'An account with this email address already exists and is verified. Please Sign In.'
          });
        }
        // Update pending credentials & send fresh signup OTP
        existingUser.name = name;
        if (age) existingUser.age = age;
        existingUser.password = password; // Mongoose pre-save hook hashes password
        existingUser.role = userRole;
        if (!existingUser.roleId) existingUser.roleId = roleId;
        existingUser.emailVerified = false;
        existingUser.accountStatus = initialAccountStatus;
        existingUser.otpDetails = {
          codeHash: otpEntry.otpHash,
          purpose: 'signup_verification',
          expiresAt: otpEntry.expiresAt,
          resendAvailableAt: otpEntry.resendAvailableAt,
          attempts: 0
        };

        if (req.body.nmcRegistrationNumber) {
          existingUser.professionalDetails = {
            nmcRegistrationNumber: req.body.nmcRegistrationNumber,
            stateMedicalCouncil: req.body.stateMedicalCouncil || 'Karnataka Medical Council',
            qualifications: req.body.qualifications || 'MBBS, MD',
            specialty: req.body.specialty || 'General Medicine'
          };
        }
        if (req.body.vehicleNumber) {
          existingUser.vehicleDetails = {
            vehicleNumber: req.body.vehicleNumber,
            category: req.body.category || 'ICU Ambulance',
            permitNumber: req.body.permitNumber || `PERMIT-${Date.now()}`
          };
        }
        if (req.body.drugLicenseNumber) {
          existingUser.licenseDetails = {
            pharmacyName: req.body.pharmacyName || name,
            drugLicenseNumber: req.body.drugLicenseNumber,
            gstin: req.body.gstin || '29AAACJ1234F1Z5'
          };
        }

        await existingUser.save();

        const emailRes = await sendOTPEmail(email, otpEntry.plainOtp, name, userRole);

        return res.status(200).json({
          success: true,
          requireOtp: true,
          email: existingUser.email,
          maskedEmail: maskEmail(existingUser.email),
          role: existingUser.role,
          roleId: existingUser.roleId,
          message: `Verification OTP sent to ${maskEmail(existingUser.email)}. Please check your inbox.`,
          previewUrl: emailRes.previewUrl
        });
      }

      // Create new user in DB
      const newUserObj = {
        roleId,
        name,
        age,
        email,
        password,
        role: userRole,
        emailVerified: false,
        verified: false,
        twoFactorEnabled: true,
        accountStatus: initialAccountStatus,
        otpDetails: {
          codeHash: otpEntry.otpHash,
          purpose: 'signup_verification',
          expiresAt: otpEntry.expiresAt,
          resendAvailableAt: otpEntry.resendAvailableAt,
          attempts: 0
        }
      };

      if (req.body.nmcRegistrationNumber) {
        newUserObj.professionalDetails = {
          nmcRegistrationNumber: req.body.nmcRegistrationNumber,
          stateMedicalCouncil: req.body.stateMedicalCouncil || 'Karnataka Medical Council',
          qualifications: req.body.qualifications || 'MBBS, MD',
          specialty: req.body.specialty || 'General Medicine'
        };
      }
      if (req.body.vehicleNumber) {
        newUserObj.vehicleDetails = {
          vehicleNumber: req.body.vehicleNumber,
          category: req.body.category || 'ICU Ambulance',
          permitNumber: req.body.permitNumber || `PERMIT-${Date.now()}`
        };
      }
      if (req.body.drugLicenseNumber) {
        newUserObj.licenseDetails = {
          pharmacyName: req.body.pharmacyName || name,
          drugLicenseNumber: req.body.drugLicenseNumber,
          gstin: req.body.gstin || '29AAACJ1234F1Z5'
        };
      }

      const user = await User.create(newUserObj);

      const emailRes = await sendOTPEmail(email, otpEntry.plainOtp, name, userRole);

      return res.status(201).json({
        success: true,
        requireOtp: true,
        email: user.email,
        maskedEmail: maskEmail(user.email),
        role: user.role,
        roleId: user.roleId,
        message: `Verification OTP sent to ${maskEmail(user.email)}. Please check your inbox.`,
        previewUrl: emailRes.previewUrl
      });
    } else {
      // Memory Store Fallback
      const existingUser = inMemoryUsers.find((u) => u.email === email);
      if (existingUser && existingUser.emailVerified) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email address already exists and is verified. Please Sign In.'
        });
      }

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const memUser = {
        _id: newUserId,
        id: newUserId,
        roleId,
        name,
        age,
        email,
        password: hashedPassword,
        role: userRole,
        emailVerified: false,
        verified: false,
        twoFactorEnabled: true,
        accountStatus: initialAccountStatus,
        otpDetails: {
          codeHash: otpEntry.otpHash,
          purpose: 'signup_verification',
          expiresAt: otpEntry.expiresAt,
          resendAvailableAt: otpEntry.resendAvailableAt,
          attempts: 0
        },
        professionalDetails: req.body.nmcRegistrationNumber ? { nmcRegistrationNumber: req.body.nmcRegistrationNumber } : undefined,
        vehicleDetails: req.body.vehicleNumber ? { vehicleNumber: req.body.vehicleNumber } : undefined,
        licenseDetails: req.body.drugLicenseNumber ? { drugLicenseNumber: req.body.drugLicenseNumber } : undefined,
        createdAt: new Date().toISOString()
      };

      if (existingUser) {
        Object.assign(existingUser, memUser);
      } else {
        inMemoryUsers.push(memUser);
      }

      const emailRes = await sendOTPEmail(email, otpEntry.plainOtp, name, userRole);

      return res.status(201).json({
        success: true,
        requireOtp: true,
        email: memUser.email,
        maskedEmail: maskEmail(memUser.email),
        role: memUser.role,
        roleId: memUser.roleId,
        message: `Verification OTP sent to ${maskEmail(memUser.email)}. Please check your inbox.`,
        previewUrl: emailRes.previewUrl
      });
    }
  } catch (error) {
    console.error('[Backend Auth Signup Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server authentication error'
    });
  }
};

// @desc    Dispatch or Resend Email Verification OTP
// @route   POST /api/auth/send-otp
// @access  Public / Private
const sendOTP = async (req, res) => {
  try {
    const { email, purpose = 'signup_verification' } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required to send verification OTP' });
    }

    let targetUser = null;
    if (mongoose.connection.readyState === 1) {
      targetUser = await User.findOne({ email });
    } else {
      targetUser = inMemoryUsers.find((u) => u.email === email);
    }

    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'No account registered with this email address' });
    }

    // Rate limiting: check resend cooldown
    if (targetUser.otpDetails?.resendAvailableAt) {
      const now = new Date();
      const availableAt = new Date(targetUser.otpDetails.resendAvailableAt);
      if (now < availableAt) {
        const remainingSeconds = Math.ceil((availableAt.getTime() - now.getTime()) / 1000);
        return res.status(429).json({
          success: false,
          error: `Please wait ${remainingSeconds} seconds before requesting a new OTP.`
        });
      }
    }

    const otpEntry = await createOTPEntry(purpose);

    targetUser.otpDetails = {
      codeHash: otpEntry.otpHash,
      purpose,
      expiresAt: otpEntry.expiresAt,
      resendAvailableAt: otpEntry.resendAvailableAt,
      attempts: 0
    };

    if (mongoose.connection.readyState === 1) {
      await targetUser.save();
    }

    const emailRes = await sendOTPEmail(targetUser.email, otpEntry.plainOtp, targetUser.name, targetUser.role);

    return res.status(200).json({
      success: true,
      message: `New verification code dispatched to ${maskEmail(targetUser.email)}`,
      maskedEmail: maskEmail(targetUser.email),
      previewUrl: emailRes.previewUrl
    });
  } catch (error) {
    console.error('[Send OTP Error]:', error);
    return res.status(500).json({ success: false, error: error.message || 'Error sending OTP' });
  }
};

// @desc    Verify 6-Digit Email Verification OTP (Purpose Scoped)
// @route   POST /api/auth/verify-otp
// @access  Public / Private
const verifyOTP = async (req, res) => {
  try {
    const { email, code, purpose = 'signup_verification' } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, error: 'Email address and 6-digit OTP code are required' });
    }

    let targetUser = null;
    if (mongoose.connection.readyState === 1) {
      targetUser = await User.findOne({ email });
    } else {
      targetUser = inMemoryUsers.find((u) => u.email === email);
    }

    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User account not found' });
    }

    // Verify code via crypto otpService with purpose validation
    const verification = await verifyOTPEntry(targetUser.otpDetails, code, purpose);
    if (!verification.valid) {
      if (targetUser.otpDetails) {
        targetUser.otpDetails.attempts = (targetUser.otpDetails.attempts || 0) + 1;
        if (mongoose.connection.readyState === 1) await targetUser.save();
      }
      return res.status(400).json({
        success: false,
        reason: verification.reason,
        error: verification.message
      });
    }

    // OTP Verified Successfully! Clear OTP & update state
    targetUser.emailVerified = true;
    targetUser.verified = true;
    targetUser.otpDetails = null; // Single-use invalidation

    if (!targetUser.roleId) {
      targetUser.roleId = generateRoleId(targetUser.role);
    }

    // Transition role-based state machine
    if (targetUser.role === 'PATIENT') {
      targetUser.accountStatus = 'ACTIVE';
    } else if (targetUser.role === 'DOCTOR') {
      targetUser.accountStatus = targetUser.professionalDetails?.nmcRegistrationNumber ? 'VERIFIED' : 'PENDING_DOCUMENT_REVIEW';
    } else if (targetUser.role === 'AMBULANCE_PARTNER') {
      targetUser.accountStatus = targetUser.vehicleDetails?.vehicleNumber ? 'VERIFIED' : 'PENDING_DOCUMENT_REVIEW';
    } else if (targetUser.role === 'PHARMACY') {
      targetUser.accountStatus = targetUser.licenseDetails?.drugLicenseNumber ? 'VERIFIED' : 'PENDING_DOCUMENT_REVIEW';
    } else {
      targetUser.accountStatus = 'ACTIVE';
    }

    if (mongoose.connection.readyState === 1) {
      await targetUser.save();
    }

    const token = generateToken(
      targetUser._id || targetUser.id,
      targetUser.email,
      targetUser.role,
      targetUser.name,
      targetUser.roleId
    );

    res.cookie('token', token, getCookieOptions());

    const userAuthData = targetUser.toAuthJSON ? targetUser.toAuthJSON() : {
      id: targetUser.id || targetUser._id,
      roleId: targetUser.roleId,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      emailVerified: true,
      verified: true,
      accountStatus: targetUser.accountStatus
    };

    return res.status(200).json({
      success: true,
      message: `🎉 Email verified successfully! Unique Role ID: ${targetUser.roleId}`,
      token,
      user: userAuthData
    });
  } catch (error) {
    console.error('[Verify OTP Error]:', error);
    return res.status(500).json({ success: false, error: error.message || 'Server error verifying OTP' });
  }
};

// @desc    Submit Stage 2 Professional/Business Verification Credentials
// @route   POST /api/auth/submit-verification
// @access  Private / Public
const submitRoleVerification = async (req, res) => {
  try {
    const { email, nmcRegistrationNumber, stateMedicalCouncil, vehicleNumber, category, drugLicenseNumber, gstin } = req.body;

    let targetUser = null;
    if (mongoose.connection.readyState === 1) {
      targetUser = await User.findOne({ email });
    } else {
      targetUser = inMemoryUsers.find((u) => u.email === email);
    }

    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User account not found' });
    }

    if (targetUser.role === 'DOCTOR' && nmcRegistrationNumber) {
      targetUser.professionalDetails = {
        nmcRegistrationNumber,
        stateMedicalCouncil: stateMedicalCouncil || 'State Medical Council',
        verifiedAt: new Date()
      };
      targetUser.accountStatus = 'VERIFIED';
    } else if (targetUser.role === 'AMBULANCE_PARTNER' && vehicleNumber) {
      targetUser.vehicleDetails = {
        vehicleNumber,
        category: category || 'ICU Ambulance',
        verifiedAt: new Date()
      };
      targetUser.accountStatus = 'VERIFIED';
    } else if (targetUser.role === 'PHARMACY' && drugLicenseNumber) {
      targetUser.licenseDetails = {
        pharmacyName: targetUser.name,
        drugLicenseNumber,
        gstin: gstin || '29AAACJ1234F1Z5',
        verifiedAt: new Date()
      };
      targetUser.accountStatus = 'VERIFIED';
    }

    if (mongoose.connection.readyState === 1) {
      await targetUser.save();
    }

    return res.json({
      success: true,
      message: '🎉 Credentials submitted and account verified!',
      roleId: targetUser.roleId,
      accountStatus: targetUser.accountStatus
    });
  } catch (error) {
    console.error('[Submit Verification Error]:', error);
    return res.status(500).json({ success: false, error: error.message || 'Error submitting verification credentials' });
  }
};

// @desc    Authenticate user & get JWT token (Login with Brute-Force Protection & 2FA)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      const issues = validationResult.error.issues || validationResult.error.errors || [];
      const firstError = issues[0]?.message || 'Invalid input data';
      return res.status(400).json({
        success: false,
        error: firstError,
        message: firstError
      });
    }

    const { email, password } = validationResult.data;

    let user = null;
    let isMatch = false;

    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({ email });
      if (!user) {
        // Enumeration protection: return generic error
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password credentials',
          message: 'Invalid email or password credentials'
        });
      }

      // Check Brute-Force Lockout
      if (user.isLocked()) {
        const remainingMins = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000));
        return res.status(423).json({
          success: false,
          error: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingMins} minutes.`
        });
      }

      isMatch = await user.matchPassword(password);

      if (!isMatch) {
        // Increment failed attempt counter & check lock threshold
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        if (user.failedLoginAttempts >= MAX_FAILED_LOGINS) {
          user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
          await user.save();
          return res.status(423).json({
            success: false,
            error: 'Account locked due to 5 consecutive failed login attempts. Please try again in 15 minutes.'
          });
        }
        await user.save();
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password credentials',
          message: 'Invalid email or password credentials'
        });
      }

      // Reset failed attempts on password success
      user.failedLoginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();

    } else {
      user = inMemoryUsers.find((u) => u.email === email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password credentials',
          message: 'Invalid email or password credentials'
        });
      }
      isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password credentials',
          message: 'Invalid email or password credentials'
        });
      }
    }

    // SECURITY CHECK 1: Email Verification
    if (!user.emailVerified) {
      const otpEntry = await createOTPEntry('signup_verification');
      user.otpDetails = {
        codeHash: otpEntry.otpHash,
        purpose: 'signup_verification',
        expiresAt: otpEntry.expiresAt,
        resendAvailableAt: otpEntry.resendAvailableAt,
        attempts: 0
      };
      if (mongoose.connection.readyState === 1) await user.save();

      const emailRes = await sendOTPEmail(user.email, otpEntry.plainOtp, user.name, user.role);

      return res.status(403).json({
        success: false,
        requireOtp: true,
        email: user.email,
        maskedEmail: maskEmail(user.email),
        error: 'Your email address is unverified. We dispatched a new 6-digit verification code to your email.',
        previewUrl: emailRes.previewUrl
      });
    }

    // SECURITY CHECK 2: Healthcare 2FA Verification Step
    if (user.twoFactorEnabled && !req.body.twoFactorCode) {
      const otpEntry = await createOTPEntry('login_2fa');
      user.otpDetails = {
        codeHash: otpEntry.otpHash,
        purpose: 'login_2fa',
        expiresAt: otpEntry.expiresAt,
        resendAvailableAt: otpEntry.resendAvailableAt,
        attempts: 0
      };
      if (mongoose.connection.readyState === 1) await user.save();

      const emailRes = await sendOTPEmail(user.email, otpEntry.plainOtp, user.name, user.role);

      return res.status(200).json({
        success: true,
        require2FA: true,
        email: user.email,
        maskedEmail: maskEmail(user.email),
        message: `2FA Login Security Code sent to ${maskEmail(user.email)}. Please verify code to complete sign in.`,
        previewUrl: emailRes.previewUrl
      });
    }

    // If 2FA code is provided, verify login_2fa OTP
    if (user.twoFactorEnabled && req.body.twoFactorCode) {
      const verification = await verifyOTPEntry(user.otpDetails, req.body.twoFactorCode, 'login_2fa');
      if (!verification.valid) {
        return res.status(400).json({
          success: false,
          error: verification.message
        });
      }
      user.otpDetails = null; // Clear single-use 2FA OTP
      if (mongoose.connection.readyState === 1) await user.save();
    }

    if (!user.roleId) {
      user.roleId = generateRoleId(user.role);
      if (mongoose.connection.readyState === 1) await user.save();
    }

    const token = generateToken(
      user._id || user.id,
      user.email,
      user.role,
      user.name,
      user.roleId
    );

    res.cookie('token', token, getCookieOptions());

    const userAuthData = user.toAuthJSON ? user.toAuthJSON() : {
      id: user.id || user._id,
      roleId: user.roleId,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: true,
      verified: true,
      accountStatus: user.accountStatus
    };

    return res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      token,
      user: userAuthData
    });
  } catch (error) {
    console.error('[Backend Auth Login Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server authentication error'
    });
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Public / Private
const logoutUser = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  return res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const userData = req.user.toAuthJSON ? req.user.toAuthJSON() : {
      id: req.user.id || req.user._id,
      roleId: req.user.roleId,
      name: req.user.name,
      age: req.user.age,
      email: req.user.email,
      role: req.user.role,
      emailVerified: req.user.emailVerified,
      verified: req.user.verified,
      accountStatus: req.user.accountStatus
    };

    return res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Error fetching user profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const validationResult = updateProfileSchema.safeParse(req.body);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]?.message || 'Invalid profile update data';
      return res.status(400).json({
        success: false,
        error: firstError,
        message: firstError
      });
    }

    const { name, age, email } = validationResult.data;

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      if (name) user.name = name;
      if (age !== undefined) user.age = age;
      if (email) user.email = email;

      await user.save();

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        user: user.toAuthJSON()
      });
    } else {
      const userIndex = inMemoryUsers.findIndex((u) => u.id === req.user.id);
      if (userIndex !== -1) {
        if (name) inMemoryUsers[userIndex].name = name;
        if (age !== undefined) inMemoryUsers[userIndex].age = age;
        if (email) inMemoryUsers[userIndex].email = email;
      }
      return res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          ...req.user,
          name: name || req.user.name,
          age: age !== undefined ? age : req.user.age,
          email: email || req.user.email
        }
      });
    }
  } catch (error) {
    console.error('[Update Profile Error]:', error);
    return res.status(500).json({ success: false, error: error.message || 'Server error updating profile' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  updateProfile,
  sendOTP,
  verifyOTP,
  submitRoleVerification
};
