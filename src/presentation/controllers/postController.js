// src/presentation/controllers/postController.js
const postService = require('../../application/services/postService');

class PostController {
  async createPost(req, res, next) {
    try {
      const userId = req.user.id;
      const postData = { ...req.body };
      
      // Add image URL if file was uploaded
      if (req.file) {
        postData.image = `/uploads/posts/${req.file.filename}`;
      }
      
      const result = await postService.createPost(userId, postData);
      
      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllPosts(req, res, next) {
    try {
      const { postType, location, userId } = req.query;
      const filters = { postType, location, userId: userId ? parseInt(userId) : undefined };
      
      const posts = await postService.getAllPosts(filters);
      
      res.status(200).json({
        success: true,
        message: 'Posts retrieved successfully',
        data: posts,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPostById(req, res, next) {
    try {
      const postId = parseInt(req.params.id);
      const post = await postService.getPostById(postId);
      
      res.status(200).json({
        success: true,
        message: 'Post retrieved successfully',
        data: post,
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePost(req, res, next) {
    try {
      const userId = req.user.id;
      const postId = parseInt(req.params.id);
      const postData = req.body;
      const updatedPost = await postService.updatePost(postId, userId, postData);
      
      res.status(200).json({
        success: true,
        message: 'Post updated successfully',
        data: updatedPost,
      });
    } catch (error) {
      next(error);
    }
  }

  async deletePost(req, res, next) {
    try {
      const userId = req.user.id;
      const postId = parseInt(req.params.id);
      await postService.deletePost(postId, userId);
      
      res.status(200).json({
        success: true,
        message: 'Post deleted successfully',
      });
    } catch (error) {
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
        data: posts,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PostController();