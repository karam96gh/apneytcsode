// src/presentation/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Register a new user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Verify account
router.post('/verify', authController.verifyAccount);

// Resend verification code
router.post('/resend-verify-code', authController.resendVerifyCode);

module.exports = router;