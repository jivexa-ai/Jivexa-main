const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  updateProfile,
  sendOTP,
  verifyOTP,
  submitRoleVerification
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public Auth & OTP routes
router.post('/signup', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/send-otp', sendOTP);
router.post('/resend-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/submit-verification', submitRoleVerification);

// Protected Auth routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
