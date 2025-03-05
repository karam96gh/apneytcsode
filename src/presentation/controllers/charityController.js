// src/presentation/controllers/charityController.js
const charityService = require('../../application/services/charityService');

class CharityController {
  async getAllCharities(req, res, next) {
    try {
      const { location } = req.query;
      const filters = { location };
      
      const charities = await charityService.getAllCharities(filters);
      
      res.status(200).json({
        success: true,
        message: 'Charities retrieved successfully',
        data: charities,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCharityById(req, res, next) {
    try {
      const charityId = parseInt(req.params.id);
      const charity = await charityService.getCharityById(charityId);
      
      res.status(200).json({
        success: true,
        message: 'Charity retrieved successfully',
        data: charity,
      });
    } catch (error) {
      next(error);
    }
  }

  async createCharity(req, res, next) {
    try {
      const charityData = req.body;
      const result = await charityService.createCharity(charityData);
      
      res.status(201).json({
        success: true,
        message: 'Charity created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCharity(req, res, next) {
    try {
      const charityId = parseInt(req.params.id);
      const charityData = req.body;
      const updatedCharity = await charityService.updateCharity(charityId, charityData);
      
      res.status(200).json({
        success: true,
        message: 'Charity updated successfully',
        data: updatedCharity,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCharity(req, res, next) {
    try {
      const charityId = parseInt(req.params.id);
      await charityService.deleteCharity(charityId);
      
      res.status(200).json({
        success: true,
        message: 'Charity deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CharityController();