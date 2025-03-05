// src/application/services/animalService.js
const prisma = require('../../infrastructure/database/prismaClient');

class AnimalService {
  async createAnimal(userId, animalData) {
    const { type, gender, age, name, images = [] } = animalData;

    // Create animal
    const animal = await prisma.animal.create({
      data: {
        type,
        gender,
        age,
        name,
        userId,
      },
    });

    // Add animal images if provided
    if (images && images.length > 0) {
      const imagePromises = images.map((image, index) => {
        return prisma.animalImage.create({
          data: {
            animalId: animal.id,
            image: image,
            isCover: index === 0, // Set first image as cover
          },
        });
      });

      await Promise.all(imagePromises);
    }

    // Get complete animal with images
    const animalWithImages = await prisma.animal.findUnique({
      where: { id: animal.id },
      include: {
        images: true,
      },
    });

    return animalWithImages;
  }

  async getAllAnimals(userId) {
    const animals = await prisma.animal.findMany({
      where: { userId },
      include: {
        images: {
          where: { isCover: true },
          take: 1,
        },
      },
    });

    return animals;
  }

  async getAnimalById(animalId, userId) {
    const animal = await prisma.animal.findFirst({
      where: {
        id: animalId,
        userId,
      },
      include: {
        images: true,
      },
    });

    if (!animal) {
      throw new Error('Animal not found or not owned by user');
    }

    return animal;
  }

  async updateAnimal(animalId, userId, animalData) {
    // Check if animal exists and belongs to user
    const existingAnimal = await prisma.animal.findFirst({
      where: {
        id: animalId,
        userId,
      },
    });

    if (!existingAnimal) {
      throw new Error('Animal not found or not owned by user');
    }

    const { type, gender, age, name } = animalData;

    // Update animal
    const updatedAnimal = await prisma.animal.update({
      where: { id: animalId },
      data: {
        type,
        gender,
        age,
        name,
      },
      include: {
        images: true,
      },
    });

    return updatedAnimal;
  }

  async deleteAnimal(animalId, userId) {
    // Check if animal exists and belongs to user
    const existingAnimal = await prisma.animal.findFirst({
      where: {
        id: animalId,
        userId,
      },
    });

    if (!existingAnimal) {
      throw new Error('Animal not found or not owned by user');
    }

    // Delete animal (will cascade to images)
    await prisma.animal.delete({
      where: { id: animalId },
    });

    return { message: 'Animal deleted successfully' };
  }

  async addAnimalImage(animalId, userId, imageUrl, isCover = false) {
    // Check if animal exists and belongs to user
    const existingAnimal = await prisma.animal.findFirst({
      where: {
        id: animalId,
        userId,
      },
    });

    if (!existingAnimal) {
      throw new Error('Animal not found or not owned by user');
    }

    // If this is a cover image, update all other images to not be covers
    if (isCover) {
      await prisma.animalImage.updateMany({
        where: {
          animalId,
        },
        data: {
          isCover: false,
        },
      });
    }

    // Add new image
    const newImage = await prisma.animalImage.create({
      data: {
        animalId,
        image: imageUrl,
        isCover,
      },
    });

    return newImage;
  }

  async deleteAnimalImage(imageId, userId) {
    // Find image with its animal
    const image = await prisma.animalImage.findUnique({
      where: { id: imageId },
      include: {
        animal: true,
      },
    });

    if (!image) {
      throw new Error('Image not found');
    }

    // Check if animal belongs to user
    if (image.animal.userId !== userId) {
      throw new Error('Not authorized to delete this image');
    }

    // Check if trying to delete the only image
    const imageCount = await prisma.animalImage.count({
      where: { animalId: image.animalId },
    });

    if (image.isCover && imageCount > 1) {
      // If deleting a cover image, set another image as cover
      const anotherImage = await prisma.animalImage.findFirst({
        where: {
          animalId: image.animalId,
          id: { not: imageId },
        },
      });

      if (anotherImage) {
        await prisma.animalImage.update({
          where: { id: anotherImage.id },
          data: { isCover: true },
        });
      }
    }

    // Delete the image
    await prisma.animalImage.delete({
      where: { id: imageId },
    });

    return { message: 'Image deleted successfully' };
  }
}
module.exports = new AnimalService();
