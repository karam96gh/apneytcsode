// src/application/services/medicalCaseService.js
const prisma = require('../../infrastructure/database/prismaClient');

class MedicalCaseService {
  async createMedicalCase(userId, caseData) {
    const { animalId, description, image } = caseData;

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

    // Create medical case
    const medicalCase = await prisma.medicalCase.create({
      data: {
        userId,
        animalId,
        description,
        image,
      },
      include: {
        animal: {
          select: {
            id: true,
            name: true,
            type: true,
            gender: true,
            age: true,
          },
        },
      },
    });

    return medicalCase;
  }

  async getAllMedicalCases(userId) {
    const medicalCases = await prisma.medicalCase.findMany({
      where: {
        userId,
      },
      orderBy: {
        currentTime: 'desc',
      },
      include: {
        animal: {
          select: {
            id: true,
            name: true,
            type: true,
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

    return medicalCases;
  }

  async getMedicalCaseById(caseId, userId) {
    const medicalCase = await prisma.medicalCase.findFirst({
      where: {
        id: caseId,
        userId,
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

    if (!medicalCase) {
      throw new Error('Medical case not found or not owned by user');
    }

    return medicalCase;
  }

  async updateMedicalCase(caseId, userId, caseData) {
    // Check if medical case exists and belongs to user
    const existingCase = await prisma.medicalCase.findFirst({
      where: {
        id: caseId,
        userId,
      },
    });

    if (!existingCase) {
      throw new Error('Medical case not found or not owned by user');
    }

    const { description, image } = caseData;

    // Update medical case
    const updatedCase = await prisma.medicalCase.update({
      where: { id: caseId },
      data: {
        description,
        image,
      },
      include: {
        animal: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    return updatedCase;
  }

  async deleteMedicalCase(caseId, userId) {
    // Check if medical case exists and belongs to user
    const existingCase = await prisma.medicalCase.findFirst({
      where: {
        id: caseId,
        userId,
      },
    });

    if (!existingCase) {
      throw new Error('Medical case not found or not owned by user');
    }

    // Delete medical case
    await prisma.medicalCase.delete({
      where: { id: caseId },
    });

    return { message: 'Medical case deleted successfully' };
  }

  async getAnimalMedicalCases(animalId, userId) {
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

    const medicalCases = await prisma.medicalCase.findMany({
      where: {
        animalId,
      },
      orderBy: {
        currentTime: 'desc',
      },
    });

    return medicalCases;
  }
}

module.exports = new MedicalCaseService();