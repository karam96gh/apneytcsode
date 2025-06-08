// server.js - Main application entry point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

// Import routes
const authRoutes = require('./src/presentation/routes/authRoutes');
const userRoutes = require('./src/presentation/routes/userRoutes');
const animalRoutes = require('./src/presentation/routes/animalRoutes');
const postRoutes = require('./src/presentation/routes/postRoutes');
const medicalCaseRoutes = require('./src/presentation/routes/medicalCaseRoutes');
const veterinaryRoutes = require('./src/presentation/routes/veterinaryRoutes');
const petStoreRoutes = require('./src/presentation/routes/petStoreRoutes');
const charityRoutes = require('./src/presentation/routes/charityRoutes');

// Import middlewares
const errorMiddleware = require('./src/presentation/middlewares/errorMiddleware');

const app = express();

// Trust proxy (important for Nginx reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: [
    'https://pets.anycode-sy.com:3333',
    'https://62.171.153.198:3333',
    'http://localhost:3000',
    'http://localhost:3333'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  }
});

app.use('/api/auth/', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1y',
  etag: true,
  lastModified: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    domain: process.env.DOMAIN || 'localhost',
    port: process.env.PORT || 3000
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Pet Care API is running successfully',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    server: {
      domain: process.env.DOMAIN || 'localhost',
      port: process.env.PORT || 3000,
      environment: process.env.NODE_ENV || 'development'
    },
    features: {
      authentication: true,
      fileUpload: true,
      rateLimit: true,
      ssl: process.env.NODE_ENV === 'production'
    }
  });
});

// Root endpoint - API documentation
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Pet Care API',
    version: '1.0.0',
    domain: 'pets.anycode-sy.com:3333',
    documentation: {
      health: '/health',
      status: '/api/status',
      endpoints: {
        authentication: {
          base: '/api/auth',
          routes: {
            'POST /api/auth/register': 'Register new user',
            'POST /api/auth/login': 'User login',
            'POST /api/auth/verify': 'Verify account',
            'POST /api/auth/resend-verify-code': 'Resend verification code'
          }
        },
        users: {
          base: '/api/users',
          routes: {
            'GET /api/users/profile': 'Get user profile',
            'PUT /api/users/profile': 'Update user profile',
            'PUT /api/users/change-password': 'Change password'
          }
        },
        animals: {
          base: '/api/animals',
          routes: {
            'GET /api/animals': 'Get user animals',
            'POST /api/animals': 'Create animal',
            'GET /api/animals/:id': 'Get animal by ID',
            'PUT /api/animals/:id': 'Update animal',
            'DELETE /api/animals/:id': 'Delete animal',
            'POST /api/animals/:id/images': 'Add animal image',
            'DELETE /api/animals/images/:imageId': 'Delete animal image'
          }
        },
        posts: {
          base: '/api/posts',
          routes: {
            'GET /api/posts': 'Get all posts (with filters)',
            'POST /api/posts': 'Create post',
            'GET /api/posts/:id': 'Get post by ID',
            'PUT /api/posts/:id': 'Update post',
            'DELETE /api/posts/:id': 'Delete post',
            'GET /api/posts/user/me': 'Get user posts'
          }
        },
        medicalCases: {
          base: '/api/medical-cases',
          routes: {
            'GET /api/medical-cases': 'Get all medical cases',
            'POST /api/medical-cases': 'Create medical case',
            'GET /api/medical-cases/:id': 'Get medical case by ID',
            'PUT /api/medical-cases/:id': 'Update medical case',
            'DELETE /api/medical-cases/:id': 'Delete medical case'
          }
        },
        veterinaries: {
          base: '/api/veterinaries',
          routes: {
            'GET /api/veterinaries': 'Get all veterinaries (with filters)',
            'GET /api/veterinaries/:id': 'Get veterinary by ID',
            'POST /api/veterinaries': 'Create veterinary (admin only)',
            'PUT /api/veterinaries/:id': 'Update veterinary (admin only)',
            'DELETE /api/veterinaries/:id': 'Delete veterinary (admin only)'
          }
        },
        petStores: {
          base: '/api/pet-stores',
          routes: {
            'GET /api/pet-stores': 'Get all pet stores (with filters)',
            'GET /api/pet-stores/:id': 'Get pet store by ID',
            'POST /api/pet-stores': 'Create pet store (admin only)',
            'PUT /api/pet-stores/:id': 'Update pet store (admin only)',
            'DELETE /api/pet-stores/:id': 'Delete pet store (admin only)'
          }
        },
        charities: {
          base: '/api/charities',
          routes: {
            'GET /api/charities': 'Get all charities (with filters)',
            'GET /api/charities/:id': 'Get charity by ID',
            'POST /api/charities': 'Create charity (admin only)',
            'PUT /api/charities/:id': 'Update charity (admin only)',
            'DELETE /api/charities/:id': 'Delete charity (admin only)'
          }
        }
      }
    },
    examples: {
      register: {
        method: 'POST',
        url: '/api/auth/register',
        body: {
          name: 'John Doe',
          mobile: '1234567890',
          password: 'password123',
          location: 'Damascus',
          address: 'Street 123'
        }
      },
      login: {
        method: 'POST',
        url: '/api/auth/login',
        body: {
          mobile: '1234567890',
          password: 'password123'
        }
      }
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/animals', animalRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/medical-cases', medicalCaseRoutes);
app.use('/api/veterinaries', veterinaryRoutes);
app.use('/api/pet-stores', petStoreRoutes);
app.use('/api/charities', charityRoutes);

// 404 handler for API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.path} not found`,
    availableEndpoints: [
      '/api/auth/*',
      '/api/users/*',
      '/api/animals/*',
      '/api/posts/*',
      '/api/medical-cases/*',
      '/api/veterinaries/*',
      '/api/pet-stores/*',
      '/api/charities/*'
    ]
  });
});

// Global 404 handler
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    suggestion: 'Visit / for API documentation'
  });
});

// Error handling middleware (should be last)
app.use(errorMiddleware);

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Pet Care API server running on port ${PORT}`);
  console.log(`🌐 Domain: ${process.env.DOMAIN || 'localhost'}`);
  console.log(`🔒 HTTPS: https://${process.env.DOMAIN || 'localhost'}:${process.env.APP_PORT || PORT}`);
  console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log(`📖 API Documentation: https://${process.env.DOMAIN || 'localhost'}:${process.env.APP_PORT || PORT}/`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

module.exports = app;