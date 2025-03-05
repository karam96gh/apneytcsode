// src/presentation/controllers/medicalCaseController.js
const medicalCaseService = require('../../application/services/medicalCaseService');
const fs = require('fs');

class MedicalCaseController {
  async createMedicalCase(req, res, next) {
    let uploadedFilePath = null;
    
    try {
      const userId = req.user.id;
      const caseData = { ...req.body };
      
      // Add image URL if file was uploaded
      if (req.file) {
        uploadedFilePath = req.file.path;
        caseData.image = `/uploads/medical-cases/${req.file.filename}`;
      }
      
      const result = await medicalCaseService.createMedicalCase(userId, caseData);
      
      res.status(201).json({
        success: true,
        message: 'Medical case created successfully',
        data: result,
      });
    } catch (error) {
      // Clean up uploaded file if there was an error
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
        fs.unlinkSync(uploadedFilePath);
      }
      
      if (error.message === 'Invalid animal ID format') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message === 'Animal not found or not owned by user') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
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
        count: medicalCases.length,
        data: medicalCases,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMedicalCaseById(req, res, next) {
    try {
      const userId = req.user.id;
      const caseId = req.params.id;
      const medicalCase = await medicalCaseService.getMedicalCaseById(caseId, userId);
      
      res.status(200).json({
        success: true,
        message: 'Medical case retrieved successfully',
        data: medicalCase,
      });
    } catch (error) {
      if (error.message === 'Invalid medical case ID format') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message === 'Medical case not found or not owned by user') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async updateMedicalCase(req, res, next) {
    let uploadedFilePath = null;
    
    try {
      const userId = req.user.id;
      const caseId = req.params.id;
      const caseData = { ...req.body };
      
      // Handle file upload if present
      if (req.file) {
        uploadedFilePath = req.file.path;
        caseData.image = `/uploads/medical-cases/${req.file.filename}`;
      }
      
      const updatedCase = await medicalCaseService.updateMedicalCase(caseId, userId, caseData);
      
      res.status(200).json({
        success: true,
        message: 'Medical case updated successfully',
        data: updatedCase,
      });
    } catch (error) {
      // Clean up uploaded file if there was an error
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
        fs.unlinkSync(uploadedFilePath);
      }
      
      if (error.message === 'Invalid medical case ID format') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message === 'Medical case not found or not owned by user') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async deleteMedicalCase(req, res, next) {
    try {
      const userId = req.user.id;
      const caseId = req.params.id;
      
      await medicalCaseService.deleteMedicalCase(caseId, userId);
      
      res.status(200).json({
        success: true,
        message: 'Medical case deleted successfully',
      });
    } catch (error) {
      if (error.message === 'Invalid medical case ID format') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message === 'Medical case not found or not owned by user') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async getAnimalMedicalCases(req, res, next) {
    try {
      const userId = req.user.id;
      const animalId = req.params.animalId;
      const medicalCases = await medicalCaseService.getAnimalMedicalCases(animalId, userId);
      
      res.status(200).json({
        success: true,
        message: 'Animal medical cases retrieved successfully',
        count: medicalCases.length,
        data: medicalCases,
      });
    } catch (error) {
      if (error.message === 'Invalid animal ID format') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message === 'Animal not found or not owned by user') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }
}

module.exports = new MedicalCaseController();