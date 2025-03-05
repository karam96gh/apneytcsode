// src/presentation/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const prisma = require('../../infrastructure/database/prismaClient');

// Middleware to authenticate user
const authenticate = async (req, res, next) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      mobile: user.mobile,
      name: user.name,
      isVerified: user.isVerified,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};

// Middleware to check if user is verified
const isVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Account not verified. Please verify your account first.',
    });
  }
  next();
};

module.exports = {
  authenticate,
  isVerified,
};