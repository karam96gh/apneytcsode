// src/application/services/charityService.js
const prisma = require('../../infrastructure/database/prismaClient');

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
    const { name, address, mobile, location } = charityData;

    // Create charity
    const charity = await prisma.charity.create({
      data: {
        name,
        address,
        mobile,
        location,
      },
    });

    return charity;
  }

  async updateCharity(charityId, charityData) {
    const { name, address, mobile, location } = charityData;

    // Check if charity exists
    const existingCharity = await prisma.charity.findUnique({
      where: {
        id: charityId,
      },
    });

    if (!existingCharity) {
      throw new Error('Charity not found');
    }

    // Update charity
    const updatedCharity = await prisma.charity.update({
      where: { id: charityId },
      data: {
        name,
        address,
        mobile,
        location,
      },
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

    // Delete charity
    await prisma.charity.delete({
      where: { id: charityId },
    });

    return { message: 'Charity deleted successfully' };
  }
}

module.exports = new CharityService();