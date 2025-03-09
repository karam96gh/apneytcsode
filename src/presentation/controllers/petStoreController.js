// src/presentation/controllers/petStoreController.js
const petStoreService = require('../../application/services/petStoreService');
const fs = require('fs');

class PetStoreController {
  async getAllPetStores(req, res, next) {
    try {
      const { location } = req.query;
      const filters = { location };
      
      const petStores = await petStoreService.getAllPetStores(filters);
      
      res.status(200).json({
        success: true,
        message: 'Pet stores retrieved successfully',
        data: petStores,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPetStoreById(req, res, next) {
    try {
      const storeId = parseInt(req.params.id);
      const petStore = await petStoreService.getPetStoreById(storeId);
      
      res.status(200).json({
        success: true,
        message: 'Pet store retrieved successfully',
        data: petStore,
      });
    } catch (error) {
      next(error);
    }
  }

  async createPetStore(req, res, next) {
    let uploadedFilePath = null;
    
    try {
      const storeData = { ...req.body };
      
      // Add image URL if file was uploaded
      if (req.file) {
        uploadedFilePath = req.file.path;
        storeData.image = `/uploads/pet-stores/${req.file.filename}`;
      }
      
      const result = await petStoreService.createPetStore(storeData);
      
      res.status(201).json({
        success: true,
        message: 'Pet store created successfully',
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

  async updatePetStore(req, res, next) {
    let uploadedFilePath = null;
    
    try {
      const storeId = parseInt(req.params.id);
      const storeData = { ...req.body };
      
      // Handle file upload if present
      if (req.file) {
        uploadedFilePath = req.file.path;
        storeData.image = `/uploads/pet-stores/${req.file.filename}`;
      }
      
      const updatedStore = await petStoreService.updatePetStore(storeId, storeData);
      
      res.status(200).json({
        success: true,
        message: 'Pet store updated successfully',
        data: updatedStore,
      });
    } catch (error) {
      // Clean up uploaded file if there was an error
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
        fs.unlinkSync(uploadedFilePath);
      }
      
      next(error);
    }
  }

  async deletePetStore(req, res, next) {
    try {
      const storeId = parseInt(req.params.id);
      await petStoreService.deletePetStore(storeId);
      
      res.status(200).json({
        success: true,
        message: 'Pet store deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PetStoreController();