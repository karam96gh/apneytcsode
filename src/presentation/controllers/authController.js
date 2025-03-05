// src/presentation/controllers/authController.js
const authService = require('../../application/services/authService');

class AuthController {
  async register(req, res, next) {
    try {
      const userData = req.body;
      const result = await authService.register(userData);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { mobile, password } = req.body;
      const result = await authService.login(mobile, password);
      
      res.status(200).json({
        success: true,
        message: 'User logged in successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyAccount(req, res, next) {
    try {
      const { mobile, verifyCode } = req.body;
      const result = await authService.verifyAccount(mobile, verifyCode);
      
      res.status(200).json({
        success: true,
        message: 'Account verified successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async resendVerifyCode(req, res, next) {
    try {
      const { mobile } = req.body;
      const result = await authService.resendVerifyCode(mobile);
      
      res.status(200).json({
        success: true,
        message: 'Verification code resent successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();