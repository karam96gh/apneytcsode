// src/application/services/petStoreService.js
const prisma = require('../../infrastructure/database/prismaClient');
const fs = require('fs');
const path = require('path');

class PetStoreService {
  async getAllPetStores(filters = {}) {
    const { location } = filters;
    
    // Build filter conditions
    const where = {};

    if (location) {
      where.location = {
        contains: location,
      };
    }

    // Fetch pet stores with filters
    const petStores = await prisma.petStore.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    });

    return petStores;
  }

  async getPetStoreById(storeId) {
    const petStore = await prisma.petStore.findUnique({
      where: {
        id: storeId,
      },
    });

    if (!petStore) {
      throw new Error('Pet store not found');
    }

    return petStore;
  }

  async createPetStore(storeData) {
    const { name, mobile, address, location, image } = storeData;

    // Create pet store
    const petStore = await prisma.petStore.create({
      data: {
        name,
        mobile,
        address,
        location,
        image,
      },
    });

    return petStore;
  }

  async updatePetStore(storeId, storeData) {
    const { name, mobile, address, location, image } = storeData;

    // Check if pet store exists
    const existingStore = await prisma.petStore.findUnique({
      where: {
        id: storeId,
      },
    });

    if (!existingStore) {
      throw new Error('Pet store not found');
    }

    // Build update data
    const updateData = {
      name,
      mobile,
      address,
      location,
    };

    // Only update image if provided
    if (image !== undefined) {
      updateData.image = image;
      
      // Delete old image if exists and not a default image
      if (existingStore.image && !existingStore.image.includes('default')) {
        try {
          const oldImagePath = path.join(__dirname, '../../../', existingStore.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (error) {
          console.error('Error deleting old image:', error);
          // Continue with update even if deletion fails
        }
      }
    }

    // Update pet store
    const updatedStore = await prisma.petStore.update({
      where: { id: storeId },
      data: updateData,
    });

    return updatedStore;
  }

  async deletePetStore(storeId) {
    // Check if pet store exists
    const existingStore = await prisma.petStore.findUnique({
      where: {
        id: storeId,
      },
    });

    if (!existingStore) {
      throw new Error('Pet store not found');
    }

    // Delete image file if exists
    if (existingStore.image && !existingStore.image.includes('default')) {
      try {
        const imagePath = path.join(__dirname, '../../../', existingStore.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (error) {
        console.error('Error deleting pet store image:', error);
        // Continue with deletion even if file deletion fails
      }
    }

    // Delete pet store
    await prisma.petStore.delete({
      where: { id: storeId },
    });

    return { message: 'Pet store deleted successfully' };
  }
}

module.exports = new PetStoreService();