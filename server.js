require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

// Routes
const authRoutes = require('./src/presentation/routes/authRoutes');
const userRoutes = require('./src/presentation/routes/userRoutes');
const animalRoutes = require('./src/presentation/routes/animalRoutes');
const postRoutes = require('./src/presentation/routes/postRoutes');
const medicalCaseRoutes = require('./src/presentation/routes/medicalCaseRoutes');
const veterinaryRoutes = require('./src/presentation/routes/veterinaryRoutes');
const petStoreRoutes = require('./src/presentation/routes/petStoreRoutes');
const charityRoutes = require('./src/presentation/routes/charityRoutes');

// Error handling middleware
const errorMiddleware = require('./src/presentation/middlewares/errorMiddleware');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'uploads' directory
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/animals', animalRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/medical-cases', medicalCaseRoutes);
app.use('/api/veterinaries', veterinaryRoutes);
app.use('/api/pet-stores', petStoreRoutes);
app.use('/api/charities', charityRoutes);

// Error handling
app.use(errorMiddleware);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});