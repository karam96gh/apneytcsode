// src/presentation/routes/charityRoutes.js
const express = require('express');
const router = express.Router();
const charityController = require('../controllers/charityController');
const { authenticate, isVerified } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Public routes - no authentication required
router.get('/', charityController.getAllCharities);
router.get('/:id', charityController.getCharityById);

// Admin routes - authentication required
// In a real application, you would add admin role check here
router.use(authenticate);

// Create a new charity - with image upload
router.post('/', upload.single('image'), charityController.createCharity);

// Update a charity - with image upload
router.put('/:id', upload.single('image'), charityController.updateCharity);

// Delete a charity
router.delete('/:id', charityController.deleteCharity);

module.exports = router;