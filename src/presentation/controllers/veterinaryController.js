// src/presentation/controllers/veterinaryController.js
const veterinaryService = require('../../application/services/veterinaryService');
const fs = require('fs');

class VeterinaryController {
  async getAllVeterinaries(req, res, next) {
    try {
      const { specialty, location } = req.query;
      const filters = { specialty, location };
      
      const veterinaries = await veterinaryService.getAllVeterinaries(filters);
      
      res.status(200).json({
        success: true,
        message: 'Veterinaries retrieved successfully',
        data: veterinaries,
      });
    } catch (error) {
      next(error);
    }
  }

  async getVeterinaryById(req, res, next) {
    try {
      const vetId = parseInt(req.params.id);
      const veterinary = await veterinaryService.getVeterinaryById(vetId);
      
      res.status(200).json({
        success: true,
        message: 'Veterinary retrieved successfully',
        data: veterinary,
      });
    } catch (error) {
      next(error);
    }
  }

  async createVeterinary(req, res, next) {
    let uploadedFilePath = null;
    
    try {
      const vetData = { ...req.body };
      
      // Add image URL if file was uploaded
      if (req.file) {
        uploadedFilePath = req.file.path;
        vetData.image = `/uploads/veterinaries/${req.file.filename}`;
      }
      
      const result = await veterinaryService.createVeterinary(vetData);
      
      res.status(201).json({
        success: true,
        message: 'Veterinary created successfully',
        data: result,
      });
    } catch (error) {
      // Clean up uploaded file if there was an error
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
        fs.unlinkSync(uploadedFilePath);
      }
      
      next(error);
    }
  }

  async updateVeterinary(req, res, next) {
    let uploadedFilePath = null;
    
    try {
      const vetId = parseInt(req.params.id);
      const vetData = { ...req.body };
      
      // Handle file upload if present
      if (req.file) {
        uploadedFilePath = req.file.path;
        vetData.image = `/uploads/veterinaries/${req.file.filename}`;
      }
      
      const updatedVet = await veterinaryService.updateVeterinary(vetId, vetData);
      
      res.status(200).json({
        success: true,
        message: 'Veterinary updated successfully',
        data: updatedVet,
      });
    } catch (error) {
      // Clean up uploaded file if there was an error
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
        fs.unlinkSync(uploadedFilePath);
      }
      
      next(error);
    }
  }

  async deleteVeterinary(req, res, next) {
    try {
      const vetId = parseInt(req.params.id);
      await veterinaryService.deleteVeterinary(vetId);
      
      res.status(200).json({
        success: true,
        message: 'Veterinary deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VeterinaryController();