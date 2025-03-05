// src/presentation/routes/veterinaryRoutes.js
const express = require('express');
const router = express.Router();
const veterinaryController = require('../controllers/veterinaryController');
const { authenticate, isVerified } = require('../middlewares/authMiddleware');

// Public routes - no authentication required
router.get('/', veterinaryController.getAllVeterinaries);
router.get('/:id', veterinaryController.getVeterinaryById);

// Admin routes - authentication required
// In a real application, you would add admin role check here
router.use(authenticate);

// Create a new veterinary
router.post('/', veterinaryController.createVeterinary);

// Update a veterinary
router.put('/:id', veterinaryController.updateVeterinary);

// Delete a veterinary
router.delete('/:id', veterinaryController.deleteVeterinary);

module.exports = router;