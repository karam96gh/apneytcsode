// src/application/services/charityService.js
const prisma = require('../../infrastructure/database/prismaClient');
const fs = require('fs');
const path = require('path');

class CharityService {
  async getAllCharities(filters = {}) {
    const { location } = filters;

    // Build filter conditions
    const where = {};

    if (location) {
      where.location = {
        contains: location,
      };
    }

    // Fetch charities with filters
    const charities = await prisma.charity.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    });

    return charities;
  }

  async getCharityById(charityId) {
    const charity = await prisma.charity.findUnique({
      where: {
        id: charityId,
      },
    });

    if (!charity) {
      throw new Error('Charity not found');
    }

    return charity;
  }

  async createCharity(charityData) {
    const { name, address, mobile, location, image } = charityData;

    // Create charity
    const charity = await prisma.charity.create({
      data: {
        name,
        address,
        mobile,
        location,
        image,
      },
    });

    return charity;
  }

  async updateCharity(charityId, charityData) {
    const { name, address, mobile, location, image } = charityData;

    // Check if charity exists
    const existingCharity = await prisma.charity.findUnique({
      where: {
        id: charityId,
      },
    });

    if (!existingCharity) {
      throw new Error('Charity not found');
    }

    // Build update data
    const updateData = {
      name,
      address,
      mobile,
      location,
    };

    // Only update image if provided
    if (image !== undefined) {
      updateData.image = image;
      
      // Delete old image if exists and not a default image
      if (existingCharity.image && !existingCharity.image.includes('default')) {
        try {
          const oldImagePath = path.join(__dirname, '../../../', existingCharity.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (error) {
          console.error('Error deleting old image:', error);
          // Continue with update even if deletion fails
        }
      }
    }

    // Update charity
    const updatedCharity = await prisma.charity.update({
      where: { id: charityId },
      data: updateData,
    });

    return updatedCharity;
  }

  async deleteCharity(charityId) {
    // Check if charity exists
    const existingCharity = await prisma.charity.findUnique({
      where: {
        id: charityId,
      },
    });

    if (!existingCharity) {
      throw new Error('Charity not found');
    }

    // Delete image file if exists
    if (existingCharity.image && !existingCharity.image.includes('default')) {
      try {
        const imagePath = path.join(__dirname, '../../../', existingCharity.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (error) {
        console.error('Error deleting charity image:', error);
        // Continue with deletion even if file deletion fails
      }
    }

    // Delete charity
    await prisma.charity.delete({
      where: { id: charityId },
    });

    return { message: 'Charity deleted successfully' };
  }
}

module.exports = new CharityService();