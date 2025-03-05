// src/presentation/routes/animalRoutes.js
const express = require('express');
const router = express.Router();
const animalController = require('../controllers/animalController');
const { authenticate, isVerified } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// All routes require authentication
router.use(authenticate);

// Create a new animal
router.post('/', animalController.createAnimal);

// Get all animals for the authenticated user
router.get('/', animalController.getAllAnimals);

// Get a specific animal
router.get('/:id', animalController.getAnimalById);

// Update an animal
router.put('/:id', animalController.updateAnimal);

// Delete an animal
router.delete('/:id', animalController.deleteAnimal);

// Add image to an animal
router.post('/:id/images', upload.single('image'), animalController.addAnimalImage);

// Delete an image from an animal
router.delete('/images/:imageId', animalController.deleteAnimalImage);

module.exports = router;