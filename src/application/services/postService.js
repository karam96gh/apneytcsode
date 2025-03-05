// src/application/services/postService.js
const prisma = require('../../infrastructure/database/prismaClient');
const path = require('path');
const fs = require('fs');

class PostService {
  async createPost(userId, postData) {
    const { animalId, image, postType, location, description } = postData;
    
    // Parse animalId as an integer
    const animalIdInt = parseInt(animalId, 10);
    
    // Check for valid integer
    if (isNaN(animalIdInt)) {
      throw new Error('Invalid animal ID format');
    }

    // Check if animal exists and belongs to user
    const animal = await prisma.animal.findFirst({
      where: {
        id: animalIdInt,
        userId,
      },
    });

    if (!animal) {
      throw new Error('Animal not found or not owned by user');
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        userId,
        animalId: animalIdInt,
        image,
        postType,
        location,
        description,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        animal: {
          include: {
            images: {
              where: {
                isCover: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    return post;
  }

  async getAllPosts(filters = {}) {
    const { postType, location, userId } = filters;

    // Build filter conditions
    const where = {};

    if (postType) {
      where.postType = postType;
    }

    if (location) {
      where.location = {
        contains: location,
      };
    }

    if (userId) {
      // Parse userId as integer if it's provided
      const userIdInt = parseInt(userId, 10);
      if (!isNaN(userIdInt)) {
        where.userId = userIdInt;
      }
    }

    // Fetch posts with filters
    const posts = await prisma.post.findMany({
      where,
      orderBy: {
        currentTime: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        animal: {
          include: {
            images: {
              where: {
                isCover: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    return posts;
  }

  async getPostById(postId) {
    // Parse postId as integer
    const postIdInt = parseInt(postId, 10);
    
    // Check for valid integer
    if (isNaN(postIdInt)) {
      throw new Error('Invalid post ID format');
    }
    
    const post = await prisma.post.findUnique({
      where: {
        id: postIdInt,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            mobile: true,
          },
        },
        animal: {
          include: {
            images: true,
          },
        },
      },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    return post;
  }

  async updatePost(postId, userId, postData) {
    // Parse postId as integer
    const postIdInt = parseInt(postId, 10);
    
    // Check for valid integer
    if (isNaN(postIdInt)) {
      throw new Error('Invalid post ID format');
    }
    
    // Check if post exists and belongs to user
    const existingPost = await prisma.post.findFirst({
      where: {
        id: postIdInt,
        userId,
      },
    });

    if (!existingPost) {
      throw new Error('Post not found or not owned by user');
    }

    // Build update data object with only provided fields
    const updateData = {};
    
    // Only include fields that are provided and different from current values
    if (postData.postType !== undefined && postData.postType !== existingPost.postType) {
      updateData.postType = postData.postType;
    }
    
    if (postData.location !== undefined && postData.location !== existingPost.location) {
      updateData.location = postData.location;
    }
    
    if (postData.description !== undefined && postData.description !== existingPost.description) {
      updateData.description = postData.description;
    }
    
    // Handle image update separately
    if (postData.image !== undefined && postData.image !== existingPost.image) {
      updateData.image = postData.image;
      
      // Delete old image file if it exists and is not the default
      if (existingPost.image && !existingPost.image.includes('default')) {
        try {
          const oldImagePath = path.join(__dirname, '../../../', existingPost.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (error) {
          console.error('Error deleting old image:', error);
          // Continue with update even if deletion fails
        }
      }
    }

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      // No changes, return existing post with proper includes
      return await prisma.post.findUnique({
        where: { id: postIdInt },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          animal: {
            include: {
              images: {
                where: {
                  isCover: true,
                },
                take: 1,
              },
            },
          },
        },
      });
    }

    // Update post
    const updatedPost = await prisma.post.update({
      where: { id: postIdInt },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        animal: {
          include: {
            images: {
              where: {
                isCover: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    return updatedPost;
  }

  async deletePost(postId, userId) {
    // Parse postId as integer
    const postIdInt = parseInt(postId, 10);
    
    // Check for valid integer
    if (isNaN(postIdInt)) {
      throw new Error('Invalid post ID format');
    }
    
    // Check if post exists and belongs to user
    const existingPost = await prisma.post.findFirst({
      where: {
        id: postIdInt,
        userId,
      },
    });

    if (!existingPost) {
      throw new Error('Post not found or not owned by user');
    }

    // Delete the image file if it exists
    if (existingPost.image) {
      try {
        const imagePath = path.join(__dirname, '../../../', existingPost.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (error) {
        console.error('Error deleting post image:', error);
        // Continue with deletion even if file deletion fails
      }
    }

    // Delete post
    await prisma.post.delete({
      where: { id: postIdInt },
    });

    return { message: 'Post deleted successfully' };
  }

  async getUserPosts(userId) {
    const posts = await prisma.post.findMany({
      where: {
        userId,
      },
      orderBy: {
        currentTime: 'desc',
      },
      include: {
        animal: {
          include: {
            images: {
              where: {
                isCover: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    return posts;
  }
}

module.exports = new PostService();