// src/presentation/middlewares/uploadMiddleware.js - تحديث لإضافة مجلد الإعلانات
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../..', 'uploads');
const animalUploadsDir = path.join(uploadsDir, 'animals');
const postUploadsDir = path.join(uploadsDir, 'posts');
const medicalCaseUploadsDir = path.join(uploadsDir, 'medical-cases');
const veterinaryUploadsDir = path.join(uploadsDir, 'veterinaries');
const petStoreUploadsDir = path.join(uploadsDir, 'pet-stores');
const charityUploadsDir = path.join(uploadsDir, 'charities');
const advertisementUploadsDir = path.join(uploadsDir, 'advertisements'); // إضافة مجلد الإعلانات

// Create directories if they don't exist
[uploadsDir, animalUploadsDir, postUploadsDir, medicalCaseUploadsDir, veterinaryUploadsDir, petStoreUploadsDir, charityUploadsDir, advertisementUploadsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine the destination folder based on route
    let destinationFolder = uploadsDir;
    
    if (req.baseUrl.includes('/animals')) {
      destinationFolder = animalUploadsDir;
    } else if (req.baseUrl.includes('/posts')) {
      destinationFolder = postUploadsDir;
    } else if (req.baseUrl.includes('/medical-cases')) {
      destinationFolder = medicalCaseUploadsDir;
    } else if (req.baseUrl.includes('/veterinaries')) {
      destinationFolder = veterinaryUploadsDir;
    } else if (req.baseUrl.includes('/pet-stores')) {
      destinationFolder = petStoreUploadsDir;
    } else if (req.baseUrl.includes('/charities')) {
      destinationFolder = charityUploadsDir;
    } else if (req.baseUrl.includes('/advertisements')) {
      destinationFolder = advertisementUploadsDir;
    }
    
    cb(null, destinationFolder);
  },
  filename: (req, file, cb) => {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept only image files
  cb(null, true);
};

// Create multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  }
});

module.exports = upload;