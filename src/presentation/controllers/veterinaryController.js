// src/presentation/controllers/veterinaryController.js
const veterinaryService = require('../../application/services/veterinaryService');

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
    try {
      const vetData = req.body;
      const result = await veterinaryService.createVeterinary(vetData);
      
      res.status(201).json({
        success: true,
        message: 'Veterinary created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateVeterinary(req, res, next) {
    try {
      const vetId = parseInt(req.params.id);
      const vetData = req.body;
      const updatedVet = await veterinaryService.updateVeterinary(vetId, vetData);
      
      res.status(200).json({
        success: true,
        message: 'Veterinary updated successfully',
        data: updatedVet,
      });
    } catch (error) {
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