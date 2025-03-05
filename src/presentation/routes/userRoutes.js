// src/presentation/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, isVerified } = require('../middlewares/authMiddleware');

// Get user profile - User must be authenticated
router.get('/profile', authenticate, userController.getUserProfile);

// Update user profile - User must be authenticated
router.put('/profile', authenticate, userController.updateUserProfile);

// Change password - User must be authenticated
router.put('/change-password', authenticate, userController.changePassword);

module.exports = router;