// src/presentation/controllers/postController.js
const postService = require('../../application/services/postService');
const fs = require('fs');

class PostController {
  async createPost(req, res, next) {
    let uploadedFilePath = null;
    
    try {
      const userId = req.user.id;
      const postData = { ...req.body };
      
      // Add image URL if file was uploaded
      if (req.file) {
        uploadedFilePath = req.file.path;
        postData.image = `/uploads/posts/${req.file.filename}`;
      }
      
      const result = await postService.createPost(userId, postData);
      
      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: result,
      });
    } catch (error) {
      // Clean up uploaded file if there was an error
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
        fs.unlinkSync(uploadedFilePath);
      }
      
      if (error.message === 'Invalid animal ID format') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message === 'Animal not found or not owned by user') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async getAllPosts(req, res, next) {
    try {
      const { postType, location, userId } = req.query;
      const filters = { postType, location, userId };
      
      const posts = await postService.getAllPosts(filters);
      
      res.status(200).json({
        success: true,
        message: 'Posts retrieved successfully',
        count: posts.length,
        data: posts,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPostById(req, res, next) {
    try {
      const postId = req.params.id;
      
      const post = await postService.getPostById(postId);
      
      res.status(200).json({
        success: true,
        message: 'Post retrieved successfully',
        data: post,
      });
    } catch (error) {
      if (error.message === 'Invalid post ID format') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message === 'Post not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async updatePost(req, res, next) {
    let uploadedFilePath = null;
    
    try {
      const userId = req.user.id;
      const postId = req.params.id;
      const postData = { ...req.body };
      
      // Handle file upload if present
      if (req.file) {
        uploadedFilePath = req.file.path;
        postData.image = `/uploads/posts/${req.file.filename}`;
      }
      
      const updatedPost = await postService.updatePost(postId, userId, postData);
      
      res.status(200).json({
        success: true,
        message: 'Post updated successfully',
        data: updatedPost,
      });
    } catch (error) {
      // Clean up uploaded file if there was an error
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
        fs.unlinkSync(uploadedFilePath);
      }
      
      if (error.message === 'Invalid post ID format') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message === 'Post not found or not owned by user') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async deletePost(req, res, next) {
    try {
      const userId = req.user.id;
      const postId = req.params.id;
      
      await postService.deletePost(postId, userId);
      
      res.status(200).json({
        success: true,
        message: 'Post deleted successfully',
      });
    } catch (error) {
      if (error.message === 'Invalid post ID format') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message === 'Post not found or not owned by user') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async getUserPosts(req, res, next) {
    try {
      const userId = req.user.id;
      const posts = await postService.getUserPosts(userId);
      
      res.status(200).json({
        success: true,
        message: 'User posts retrieved successfully',
        count: posts.length,
        data: posts,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PostController();