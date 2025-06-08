// src/presentation/controllers/advertisementController.js
const advertisementService = require('../../application/services/advertisementService');
const fs = require('fs');

class AdvertisementController {
  async createAdvertisement(req, res, next) {
    let uploadedFilePath = null;
    
    try {
      const adData = { ...req.body };
      const userId = req.user.id;
      
      // التحقق من أن المستخدم هو الأدمن (يمكنك تعديل هذا حسب نظامك)
      if (userId !== 26) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin only.',
        });
      }

      // إضافة رابط الصورة إذا تم رفع ملف
      if (req.file) {
        uploadedFilePath = req.file.path;
        adData.image = `/uploads/advertisements/${req.file.filename}`;
      }

      // التحقق من وجود الصورة (مطلوبة)
      if (!adData.image) {
        return res.status(400).json({
          success: false,
          message: 'Image is required',
        });
      }

      const result = await advertisementService.createAdvertisement(adData);
      
      res.status(201).json({
        success: true,
        message: 'Advertisement created successfully',
        data: result,
      });
    } catch (error) {
      // تنظيف الملف المرفوع في حالة حدوث خطأ
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
        fs.unlinkSync(uploadedFilePath);
      }
      
      if (error.message === 'End date must be in the future' || error.message === 'Image is required') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      
      next(error);
    }
  }

  async getAllAdvertisements(req, res, next) {
    try {
      const { isActive, includeExpired } = req.query;
      const filters = { 
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        includeExpired: includeExpired === 'true'
      };
      
      const advertisements = await advertisementService.getAllAdvertisements(filters);
      
      res.status(200).json({
        success: true,
        message: 'Advertisements retrieved successfully',
        count: advertisements.length,
        data: advertisements,
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveAdvertisements(req, res, next) {
    try {
      const advertisements = await advertisementService.getActiveAdvertisements();
      
      res.status(200).json({
        success: true,
        message: 'Active advertisements retrieved successfully',
        count: advertisements.length,
        data: advertisements,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAdvertisementById(req, res, next) {
    try {
      const adId = parseInt(req.params.id);
      
      if (isNaN(adId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid advertisement ID format',
        });
      }

      const advertisement = await advertisementService.getAdvertisementById(adId);
      
      res.status(200).json({
        success: true,
        message: 'Advertisement retrieved successfully',
        data: advertisement,
      });
    } catch (error) {
      if (error.message === 'Advertisement not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async updateAdvertisement(req, res, next) {
    let uploadedFilePath = null;
    
    try {
      const adId = parseInt(req.params.id);
      const adData = { ...req.body };
      const userId = req.user.id;
      
      if (isNaN(adId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid advertisement ID format',
        });
      }

      // التحقق من أن المستخدم هو الأدمن
      if (userId !== 26) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin only.',
        });
      }

      // التعامل مع رفع الملف إذا كان موجود
      if (req.file) {
        uploadedFilePath = req.file.path;
        adData.image = `/uploads/advertisements/${req.file.filename}`;
      }
      
      const updatedAd = await advertisementService.updateAdvertisement(adId, adData);
      
      res.status(200).json({
        success: true,
        message: 'Advertisement updated successfully',
        data: updatedAd,
      });
    } catch (error) {
      // تنظيف الملف المرفوع في حالة حدوث خطأ
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
        fs.unlinkSync(uploadedFilePath);
      }
      
      if (error.message === 'Advertisement not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message === 'End date must be in the future') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async deleteAdvertisement(req, res, next) {
    try {
      const adId = parseInt(req.params.id);
      const userId = req.user.id;
      
      if (isNaN(adId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid advertisement ID format',
        });
      }

      // التحقق من أن المستخدم هو الأدمن
      if (userId !== 26) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin only.',
        });
      }

      await advertisementService.deleteAdvertisement(adId);
      
      res.status(200).json({
        success: true,
        message: 'Advertisement deleted successfully',
      });
    } catch (error) {
      if (error.message === 'Advertisement not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async recordClick(req, res, next) {
    try {
      const adId = parseInt(req.params.id);
      
      if (isNaN(adId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid advertisement ID format',
        });
      }

      const result = await advertisementService.recordClick(adId);
      
      res.status(200).json({
        success: true,
        message: 'Click recorded successfully',
        data: result,
      });
    } catch (error) {
      if (error.message === 'Advertisement not found or expired') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async getAdvertisementStats(req, res, next) {
    try {
      const adId = parseInt(req.params.id);
      const userId = req.user.id;
      
      if (isNaN(adId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid advertisement ID format',
        });
      }

      // التحقق من أن المستخدم هو الأدمن
      if (userId !== 26) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin only.',
        });
      }

      const stats = await advertisementService.getAdvertisementStats(adId);
      
      res.status(200).json({
        success: true,
        message: 'Advertisement statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      if (error.message === 'Advertisement not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async cleanupExpiredAds(req, res, next) {
    try {
      const userId = req.user.id;
      
      // التحقق من أن المستخدم هو الأدمن
      if (userId !== 26) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin only.',
        });
      }

      const result = await advertisementService.cleanupExpiredAds();
      
      res.status(200).json({
        success: true,
        message: 'Expired advertisements cleanup completed',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdvertisementController();