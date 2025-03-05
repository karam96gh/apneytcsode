// src/presentation/controllers/animalController.js
const animalService = require('../../application/services/animalService');

class AnimalController {
  async createAnimal(req, res, next) {
    try {
      const userId = req.user.id;
      const animalData = req.body;
      const result = await animalService.createAnimal(userId, animalData);
      
      res.status(201).json({
        success: true,
        message: 'Animal created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllAnimals(req, res, next) {
    try {
      const userId = req.user.id;
      const animals = await animalService.getAllAnimals(userId);
      
      res.status(200).json({
        success: true,
        message: 'Animals retrieved successfully',
        data: animals,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAnimalById(req, res, next) {
    try {
      const userId = req.user.id;
      const animalId = parseInt(req.params.id);
      const animal = await animalService.getAnimalById(animalId, userId);
      
      res.status(200).json({
        success: true,
        message: 'Animal retrieved successfully',
        data: animal,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAnimal(req, res, next) {
    try {
      const userId = req.user.id;
      const animalId = parseInt(req.params.id);
      const animalData = req.body;
      const updatedAnimal = await animalService.updateAnimal(animalId, userId, animalData);
      
      res.status(200).json({
        success: true,
        message: 'Animal updated successfully',
        data: updatedAnimal,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAnimal(req, res, next) {
    try {
      const userId = req.user.id;
      const animalId = parseInt(req.params.id);
      await animalService.deleteAnimal(animalId, userId);
      
      res.status(200).json({
        success: true,
        message: 'Animal deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async addAnimalImage(req, res, next) {
    try {
      const userId = req.user.id;
      const animalId = parseInt(req.params.id);
      const { isCover } = req.body;
      
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided',
        });
      }
      
      // Generate URL for the uploaded file
      const imageUrl = `/uploads/animals/${req.file.filename}`;
      
      const newImage = await animalService.addAnimalImage(animalId, userId, imageUrl, isCover === 'true');
      
      res.status(201).json({
        success: true,
        message: 'Image added successfully',
        data: newImage,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAnimalImage(req, res, next) {
    try {
      const userId = req.user.id;
      const imageId = parseInt(req.params.imageId);
      await animalService.deleteAnimalImage(imageId, userId);
      
      res.status(200).json({
        success: true,
        message: 'Image deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnimalController();