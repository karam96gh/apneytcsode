// src/presentation/routes/postRoutes.js
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { authenticate, isVerified } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Public routes - no authentication required
router.get('/', postController.getAllPosts);
router.get('/:id', postController.getPostById);

// Protected routes - authentication required
router.use(authenticate);

// Create a new post
router.post('/', upload.single('image'), postController.createPost);

// Update a post
router.put('/:id',  upload.single('image'),postController.updatePost);

// Delete a post
router.delete('/:id', postController.deletePost);

// Get all posts for the authenticated user
router.get('/user/me', postController.getUserPosts);

module.exports = router;