  // src/application/services/authService.js
  const bcrypt = require('bcrypt');
  const jwt = require('jsonwebtoken');
  const prisma = require('../../infrastructure/database/prismaClient');

  class AuthService {
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

      // In a real app, you would send SMS with verification code here
      console.log(`Verification code for ${mobile}: ${verifyCode}`);

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

      // Create JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          mobile: user.mobile,
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
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

      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;

      return userWithoutPassword;
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

      // In a real app, you would send SMS with verification code here
      console.log(`New verification code for ${mobile}: ${verifyCode}`);

      return { message: 'Verification code resent successfully' };
    }
  }

  module.exports = new AuthService();