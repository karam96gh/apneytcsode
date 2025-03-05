// src/presentation/controllers/medicalCaseController.js
const medicalCaseService = require('../../application/services/medicalCaseService');

class MedicalCaseController {
  async createMedicalCase(req, res, next) {
    try {
      const userId = req.user.id;
      const caseData = { ...req.body };
      
      // Add image URL if file was uploaded
      if (req.file) {
        caseData.image = `/uploads/medical-cases/${req.file.filename}`;
      }
      
      const result = await medicalCaseService.createMedicalCase(userId, caseData);
      
      res.status(201).json({
        success: true,
        message: 'Medical case created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllMedicalCases(req, res, next) {
    try {
      const userId = req.user.id;
      const medicalCases = await medicalCaseService.getAllMedicalCases(userId);
      
      res.status(200).json({
        success: true,
        message: 'Medical cases retrieved successfully',
        data: medicalCases,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMedicalCaseById(req, res, next) {
    try {
      const userId = req.user.id;
      const caseId = parseInt(req.params.id);
      const medicalCase = await medicalCaseService.getMedicalCaseById(caseId, userId);
      
      res.status(200).json({
        success: true,
        message: 'Medical case retrieved successfully',
        data: medicalCase,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMedicalCase(req, res, next) {
    try {
      const userId = req.user.id;
      const caseId = parseInt(req.params.id);
      const caseData = req.body;
      const updatedCase = await medicalCaseService.updateMedicalCase(caseId, userId, caseData);
      
      res.status(200).json({
        success: true,
        message: 'Medical case updated successfully',
        data: updatedCase,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMedicalCase(req, res, next) {
    try {
      const userId = req.user.id;
      const caseId = parseInt(req.params.id);
      await medicalCaseService.deleteMedicalCase(caseId, userId);
      
      res.status(200).json({
        success: true,
        message: 'Medical case deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getAnimalMedicalCases(req, res, next) {
    try {
      const userId = req.user.id;
      const animalId = parseInt(req.params.animalId);
      const medicalCases = await medicalCaseService.getAnimalMedicalCases(animalId, userId);
      
      res.status(200).json({
        success: true,
        message: 'Animal medical cases retrieved successfully',
        data: medicalCases,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MedicalCaseController();