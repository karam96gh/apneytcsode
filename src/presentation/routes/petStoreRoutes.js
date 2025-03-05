// src/presentation/routes/petStoreRoutes.js
const express = require('express');
const router = express.Router();
const petStoreController = require('../controllers/petStoreController');
const { authenticate, isVerified } = require('../middlewares/authMiddleware');

// Public routes - no authentication required
router.get('/', petStoreController.getAllPetStores);
router.get('/:id', petStoreController.getPetStoreById);

// Admin routes - authentication required
// In a real application, you would add admin role check here
router.use(authenticate);

// Create a new pet store
router.post('/', petStoreController.createPetStore);

// Update a pet store
router.put('/:id', petStoreController.updatePetStore);

// Delete a pet store
router.delete('/:id', petStoreController.deletePetStore);

module.exports = router;