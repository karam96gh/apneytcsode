// src/presentation/controllers/userController.js
const userService = require('../../application/services/userService');

class UserController {
  async getUserProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const userProfile = await userService.getUserProfile(userId);
      
      res.status(200).json({
        success: true,
        message: 'User profile retrieved successfully',
        data: userProfile,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const userData = req.body;
      const updatedProfile = await userService.updateUserProfile(userId, userData);
      
      res.status(200).json({
        success: true,
        message: 'User profile updated successfully',
        data: updatedProfile,
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      await userService.changePassword(userId, currentPassword, newPassword);
      
      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();