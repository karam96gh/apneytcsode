// src/presentation/controllers/charityController.js
const charityService = require('../../application/services/charityService');
const fs = require('fs');

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
    let uploadedFilePath = null;
    
    try {
      const charityData = { ...req.body };
      const userId = req.user.id;
      if(userId!=26)
      {
        res.status(400).json({
          success: false,
          message: 'not admin',
        });
      }
      // Add image URL if file was uploaded
      if (req.file) {
        uploadedFilePath = req.file.path;
        charityData.image = `/uploads/charities/${req.file.filename}`;
      }
      
      const result = await charityService.createCharity(charityData);
      
      res.status(201).json({
        success: true,
        message: 'Charity created successfully',
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

  async updateCharity(req, res, next) {
    let uploadedFilePath = null;
    const userId = req.user.id;
    if(userId!=26)
    {
      res.status(400).json({
        success: false,
        message: 'not admin',
      });
    }
    try {
      const charityId = parseInt(req.params.id);
      const charityData = { ...req.body };
      
      // Handle file upload if present
      if (req.file) {
        uploadedFilePath = req.file.path;
        charityData.image = `/uploads/charities/${req.file.filename}`;
      }
      
      const updatedCharity = await charityService.updateCharity(charityId, charityData);
      
      res.status(200).json({
        success: true,
        message: 'Charity updated successfully',
        data: updatedCharity,
      });
    } catch (error) {
      // Clean up uploaded file if there was an error
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
        fs.unlinkSync(uploadedFilePath);
      }
      
      next(error);
    }
  }

  async deleteCharity(req, res, next) {
    try {
      const charityId = parseInt(req.params.id);
      const userId = req.user.id;
      if(userId!=26)
      {
        res.status(400).json({
          success: false,
          message: 'not admin',
        });
      }
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