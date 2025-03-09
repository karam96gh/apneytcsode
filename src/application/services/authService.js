// src/application/services/authService.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../infrastructure/database/prismaClient');
const axios = require('axios');

// WhatsApp OTP service configuration
const OTP_SERVICE_URL = 'http://62.171.153.198:3698/send-otp';

class AuthService {
  /**
   * Send verification code via WhatsApp
   * @param {string} mobile - Mobile number with country code
   * @param {string} verifyCode - Verification code to send
   * @returns {Promise<Object>} - Response from OTP service
   */
  async sendWhatsAppOTP(mobile, verifyCode) {
    try {
      // Format message for WhatsApp
      const formattedMessage = `Your verification code is: ${verifyCode}`;
      
      // Make request to WhatsApp OTP service
      const response = await axios.post(OTP_SERVICE_URL, {
        phoneNumber: mobile, // Make sure this includes country code without '+' sign
        otp: formattedMessage
      });
      
      console.log(`WhatsApp OTP sent to ${mobile}: ${verifyCode}`);
      return response.data;
    } catch (error) {
      console.error('Failed to send WhatsApp OTP:', error.message);
      
      // Don't throw error here - we want registration to continue even if OTP fails
      // In production, you might want to handle this differently
      return { success: false, error: error.message };
    }
  }

  async register(userData) {
    const { name, mobile, password, location, address } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { mobile },
    });

    if (existingUser) {
      throw new Error('User with this mobile number already exists');
    }

    // Generate verification code
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        mobile,
        password: hashedPassword,
        location,
        address,
        verifyCode,
        isVerified: false,
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    // Send OTP via WhatsApp
    await this.sendWhatsAppOTP(mobile, verifyCode);

    return userWithoutPassword;
  }

  async login(mobile, password) {
    // Find user by mobile number
    const user = await prisma.user.findUnique({
      where: { mobile },
    });

    if (!user) {
      throw new Error('Invalid mobile number or password');
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid mobile number or password');
    }

    // Check if user is verified
  

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        mobile: user.mobile,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7y' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async verifyAccount(mobile, verifyCode) {
    const user = await prisma.user.findUnique({
      where: { mobile },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.verifyCode !== verifyCode) {
      throw new Error('Invalid verification code');
    }

    const updatedUser = await prisma.user.update({
      where: { mobile },
      data: {
        isVerified: true,
        verifyCode: null,
      },
    });
    const token = jwt.sign(
      {
        userId: user.id,
        mobile: user.mobile,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7y' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser;

    return {
      user: userWithoutPassword,
      token,
    };
    }

  async resendVerifyCode(mobile) {
    const user = await prisma.user.findUnique({
      where: { mobile },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.isVerified) {
      throw new Error('User is already verified');
    }

    // Generate new verification code
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Update user with new verification code
    await prisma.user.update({
      where: { mobile },
      data: { verifyCode },
    });

    // Send OTP via WhatsApp
    await this.sendWhatsAppOTP(mobile, verifyCode);

    return { message: 'Verification code resent successfully' };
  }

  // You might want to add a method for password reset as well
  async requestPasswordReset(mobile) {
    const user = await prisma.user.findUnique({
      where: { mobile },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Update user with reset code
    await prisma.user.update({
      where: { mobile },
      data: { resetCode },
    });

    // Send reset code via WhatsApp
    await this.sendWhatsAppOTP(mobile, resetCode);

    return { message: 'Password reset code sent successfully' };
  }

  async resetPassword(mobile, resetCode, newPassword) {
    const user = await prisma.user.findUnique({
      where: { mobile },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.resetCode !== resetCode) {
      throw new Error('Invalid reset code');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset code
    const updatedUser = await prisma.user.update({
      where: { mobile },
      data: {
        password: hashedPassword,
        resetCode: null,
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser;

    return userWithoutPassword;
  }
}

module.exports = new AuthService();