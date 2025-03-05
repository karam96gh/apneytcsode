// src/application/services/veterinaryService.js
const prisma = require('../../infrastructure/database/prismaClient');

class VeterinaryService {
  async getAllVeterinaries(filters = {}) {
    const { specialty, location } = filters;

    // Build filter conditions
    const where = {};

    if (specialty) {
      where.specialty = {
        contains: specialty,
      };
    }

    if (location) {
      where.location = {
        contains: location,
      };
    }

    // Fetch veterinaries with filters
    const veterinaries = await prisma.veterinary.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    });

    return veterinaries;
  }

  async getVeterinaryById(vetId) {
    const veterinary = await prisma.veterinary.findUnique({
      where: {
        id: vetId,
      },
    });

    if (!veterinary) {
      throw new Error('Veterinary not found');
    }

    return veterinary;
  }

  async createVeterinary(vetData) {
    const { name, specialty, address, location, mobile } = vetData;

    // Create veterinary
    const veterinary = await prisma.veterinary.create({
      data: {
        name,
        specialty,
        address,
        location,
        mobile,
      },
    });

    return veterinary;
  }

  async updateVeterinary(vetId, vetData) {
    const { name, specialty, address, location, mobile } = vetData;

    // Check if veterinary exists
    const existingVet = await prisma.veterinary.findUnique({
      where: {
        id: vetId,
      },
    });

    if (!existingVet) {
      throw new Error('Veterinary not found');
    }

    // Update veterinary
    const updatedVet = await prisma.veterinary.update({
      where: { id: vetId },
      data: {
        name,
        specialty,
        address,
        location,
        mobile,
      },
    });

    return updatedVet;
  }

  async deleteVeterinary(vetId) {
    // Check if veterinary exists
    const existingVet = await prisma.veterinary.findUnique({
      where: {
        id: vetId,
      },
    });

    if (!existingVet) {
      throw new Error('Veterinary not found');
    }

    // Delete veterinary
    await prisma.veterinary.delete({
      where: { id: vetId },
    });

    return { message: 'Veterinary deleted successfully' };
  }
}

module.exports = new VeterinaryService();