// src/application/services/petStoreService.js
const prisma = require('../../infrastructure/database/prismaClient');

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
    const { name, mobile, address, location } = storeData;

    // Create pet store
    const petStore = await prisma.petStore.create({
      data: {
        name,
        mobile,
        address,
        location,
      },
    });

    return petStore;
  }

  async updatePetStore(storeId, storeData) {
    const { name, mobile, address, location } = storeData;

    // Check if pet store exists
    const existingStore = await prisma.petStore.findUnique({
      where: {
        id: storeId,
      },
    });

    if (!existingStore) {
      throw new Error('Pet store not found');
    }

    // Update pet store
    const updatedStore = await prisma.petStore.update({
      where: { id: storeId },
      data: {
        name,
        mobile,
        address,
        location,
      },
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

    // Delete pet store
    await prisma.petStore.delete({
      where: { id: storeId },
    });

    return { message: 'Pet store deleted successfully' };
  }
}

module.exports = new PetStoreService();