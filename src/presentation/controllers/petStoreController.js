// src/presentation/controllers/petStoreController.js
const petStoreService = require('../../application/services/petStoreService');

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
    try {
      const storeData = req.body;
      const result = await petStoreService.createPetStore(storeData);
      
      res.status(201).json({
        success: true,
        message: 'Pet store created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePetStore(req, res, next) {
    try {
      const storeId = parseInt(req.params.id);
      const storeData = req.body;
      const updatedStore = await petStoreService.updatePetStore(storeId, storeData);
      
      res.status(200).json({
        success: true,
        message: 'Pet store updated successfully',
        data: updatedStore,
      });
    } catch (error) {
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