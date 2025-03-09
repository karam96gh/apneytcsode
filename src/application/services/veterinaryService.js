// src/application/services/veterinaryService.js
const prisma = require('../../infrastructure/database/prismaClient');
const fs = require('fs');
const path = require('path');

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
    const { name, specialty, address, location, mobile, image } = vetData;

    // Create veterinary
    const veterinary = await prisma.veterinary.create({
      data: {
        name,
        specialty,
        address,
        location,
        mobile,
        image,
      },
    });

    return veterinary;
  }

  async updateVeterinary(vetId, vetData) {
    const { name, specialty, address, location, mobile, image } = vetData;

    // Check if veterinary exists
    const existingVet = await prisma.veterinary.findUnique({
      where: {
        id: vetId,
      },
    });

    if (!existingVet) {
      throw new Error('Veterinary not found');
    }

    // Build update data
    const updateData = {
      name,
      specialty,
      address,
      location,
      mobile,
    };

    // Only update image if provided
    if (image !== undefined) {
      updateData.image = image;
      
      // Delete old image if exists and not a default image
      if (existingVet.image && !existingVet.image.includes('default')) {
        try {
          const oldImagePath = path.join(__dirname, '../../../', existingVet.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (error) {
          console.error('Error deleting old image:', error);
          // Continue with update even if deletion fails
        }
      }
    }

    // Update veterinary
    const updatedVet = await prisma.veterinary.update({
      where: { id: vetId },
      data: updateData,
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

    // Delete image file if exists
    if (existingVet.image && !existingVet.image.includes('default')) {
      try {
        const imagePath = path.join(__dirname, '../../../', existingVet.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (error) {
        console.error('Error deleting veterinary image:', error);
        // Continue with deletion even if file deletion fails
      }
    }

    // Delete veterinary
    await prisma.veterinary.delete({
      where: { id: vetId },
    });

    return { message: 'Veterinary deleted successfully' };
  }
}

module.exports = new VeterinaryService();