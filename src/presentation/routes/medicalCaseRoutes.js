// src/presentation/routes/medicalCaseRoutes.js
const express = require('express');
const router = express.Router();
const medicalCaseController = require('../controllers/medicalCaseController');
const { authenticate, isVerified } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// All routes require authentication
router.use(authenticate);

// Create a new medical case
router.post('/', upload.single('image'), medicalCaseController.createMedicalCase);

// Get all medical cases for the authenticated user
router.get('/', medicalCaseController.getAllMedicalCases);

// Get a specific medical case
router.get('/:id', medicalCaseController.getMedicalCaseById);

// Update a medical case - add upload.single('image') here
router.put('/:id', upload.single('image'), medicalCaseController.updateMedicalCase);

// Delete a medical case
router.delete('/:id', medicalCaseController.deleteMedicalCase);

// Get all medical cases for a specific animal
router.get('/animal/:animalId', medicalCaseController.getAnimalMedicalCases);

module.exports = router;