// app.js أو index.js - إضافة routes الإعلانات
const express = require('express');
const cors = require('cors');
const path = require('path');
const errorMiddleware = require('./src/presentation/middlewares/errorMiddleware');

// Import routes
const authRoutes = require('./src/presentation/routes/authRoutes');
const userRoutes = require('./src/presentation/routes/userRoutes');
const animalRoutes = require('./src/presentation/routes/animalRoutes');
const postRoutes = require('./src/presentation/routes/postRoutes');
const medicalCaseRoutes = require('./src/presentation/routes/medicalCaseRoutes');
const veterinaryRoutes = require('./src/presentation/routes/veterinaryRoutes');
const petStoreRoutes = require('./src/presentation/routes/petStoreRoutes');
const charityRoutes = require('./src/presentation/routes/charityRoutes');
const advertisementRoutes = require('./src/presentation/routes/advertisementRoutes'); // إضافة جديدة

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/animals', animalRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/medical-cases', medicalCaseRoutes);
app.use('/api/veterinaries', veterinaryRoutes);
app.use('/api/pet-stores', petStoreRoutes);
app.use('/api/charities', charityRoutes);
app.use('/api/advertisements', advertisementRoutes); // إضافة route الإعلانات

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(errorMiddleware);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;