// src/application/services/postService.js
const prisma = require('../../infrastructure/database/prismaClient');

class PostService {
  async createPost(userId, postData) {
    const { animalId, image, postType, location, description } = postData;

    // Check if animal exists and belongs to user
    const animal = await prisma.animal.findFirst({
      where: {
        id: animalId,
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
        animalId,
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
      where.userId = userId;
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
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
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
    // Check if post exists and belongs to user
    const existingPost = await prisma.post.findFirst({
      where: {
        id: postId,
        userId,
      },
    });

    if (!existingPost) {
      throw new Error('Post not found or not owned by user');
    }

    const { image, postType, location, description } = postData;

    // Update post
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
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

    return updatedPost;
  }

  async deletePost(postId, userId) {
    // Check if post exists and belongs to user
    const existingPost = await prisma.post.findFirst({
      where: {
        id: postId,
        userId,
      },
    });

    if (!existingPost) {
      throw new Error('Post not found or not owned by user');
    }

    // Delete post
    await prisma.post.delete({
      where: { id: postId },
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