const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const { signupSchema, loginSchema, updateProfileSchema } = require('../validators/userValidators');
const { sendOTPEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'jivexa_health_jwt_secret_key_2026_super_secure_auth_token_string';

// Helper to generate signed JWT token
const generateToken = (id, email, role, name) => {
  if (!JWT_SECRET) {
    throw new Error('JWT secret key is not configured in backend environment');
  }
  return jwt.sign(
    { id, email, role, name },
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

// @desc    Register a new user (Signup)
// @route   POST /api/auth/signup
// @access  Public
const registerUser = async (req, res) => {
  try {
    // 1. Zod Input Validation
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

    // 2. Database mode vs Memory Fallback mode
    if (mongoose.connection.readyState === 1) {
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email address already exists',
          message: 'An account with this email address already exists'
        });
      }

      // Create new user (Pre-save hook in User model automatically hashes password with 12 salt rounds)
      const user = await User.create({
        name,
        age,
        email,
        password,
        role: role || 'PATIENT'
      });

      const token = generateToken(user._id, user.email, user.role, user.name);

      // Set httpOnly cookie
      res.cookie('token', token, getCookieOptions());

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: user.toAuthJSON()
      });
    } else {
      // Memory Store Fallback
      if (inMemoryUsers.some((u) => u.email === email)) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email address already exists',
          message: 'An account with this email address already exists'
        });
      }

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newUser = {
        _id: newUserId,
        id: newUserId,
        name,
        age,
        email,
        password: hashedPassword,
        role: role || 'PATIENT',
        verified: true,
        usage: {
          tokenUsed: 0,
          tokenLimit: 10000,
          resetAt: new Date(Date.now() + 5 * 60 * 60 * 1000),
          totalTokenUsed: 0
        },
        createdAt: new Date().toISOString()
      };

      inMemoryUsers.push(newUser);

      const token = generateToken(newUser.id, newUser.email, newUser.role, newUser.name);
      res.cookie('token', token, getCookieOptions());

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          age: newUser.age,
          email: newUser.email,
          role: newUser.role,
          verified: newUser.verified,
          usage: newUser.usage,
          createdAt: newUser.createdAt
        }
      });
    }
  } catch (error) {
    console.error('[Backend Auth Signup Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server authentication error',
      message: 'Internal server authentication error'
    });
  }
};

// @desc    Authenticate user & get JWT token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    // 1. Zod Input Validation
    const validationResult = loginSchema.safeParse(req.body);
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

    const { email, password } = validationResult.data;

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email credentials or account does not exist',
          message: 'Invalid email credentials or account does not exist'
        });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid password credentials',
          message: 'Invalid password credentials'
        });
      }

      const token = generateToken(user._id, user.email, user.role, user.name);

      // Set httpOnly cookie
      res.cookie('token', token, getCookieOptions());

      return res.status(200).json({
        success: true,
        message: 'User logged in successfully',
        token,
        user: user.toAuthJSON()
      });
    } else {
      // Memory Store Fallback
      const user = inMemoryUsers.find((u) => u.email === email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email credentials or account does not exist',
          message: 'Invalid email credentials or account does not exist'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid password credentials',
          message: 'Invalid password credentials'
        });
      }

      const token = generateToken(user.id, user.email, user.role, user.name);
      res.cookie('token', token, getCookieOptions());

      return res.status(200).json({
        success: true,
        message: 'User logged in successfully',
        token,
        user: {
          id: user.id,
          name: user.name,
          age: user.age,
          email: user.email,
          role: user.role,
          verified: user.verified,
          usage: user.usage,
          createdAt: user.createdAt
        }
      });
    }
  } catch (error) {
    console.error('[Backend Auth Login Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server authentication error',
      message: 'Internal server authentication error'
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
      name: req.user.name,
      age: req.user.age,
      email: req.user.email,
      role: req.user.role,
      verified: req.user.verified,
      usage: req.user.usage
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

// @desc    Generate & Dispatch Real Email OTP (DISABLED / COMMENTED OUT PER USER DIRECTIVE)
// @route   POST /api/auth/send-otp
// @access  Public / Private
const sendOTP = async (req, res) => {
  /* OTP setup currently disabled per request
  const emailResult = await sendOTPEmail(email, otpCode, userName);
  */
  return res.status(200).json({
    success: true,
    message: 'OTP verification is currently disabled. Account registration is direct.',
    disabled: true
  });
};

// @desc    Verify 6-Digit Email OTP (DISABLED / COMMENTED OUT PER USER DIRECTIVE)
// @route   POST /api/auth/verify-otp
// @access  Public / Private
const verifyOTP = async (req, res) => {
  /* OTP verification logic commented out
  let isMatched = false;
  if (targetUser && targetUser.otp === code) { ... }
  */
  return res.status(200).json({
    success: true,
    message: 'OTP verification bypassed successfully.',
    verified: true
  });
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  updateProfile,
  sendOTP,
  verifyOTP
};
