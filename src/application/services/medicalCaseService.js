// src/application/services/medicalCaseService.js
const prisma = require('../../infrastructure/database/prismaClient');
const fs = require('fs');
const path = require('path');

class MedicalCaseService {
  async createMedicalCase(userId, caseData) {
    const {title, description, image } = caseData;
    
    // Create medical case without animal relation
    const medicalCase = await prisma.medicalCase.create({
      data: {
        userId,
        title,
        description,
        image,
      },
    });

    return medicalCase;
  }

  async getAllMedicalCases(userId) {
    const medicalCases = await prisma.medicalCase.findMany({
      orderBy: {
        currentTime: 'desc',
      },
    });

    return medicalCases;
  }

  async getMedicalCaseById(caseId, userId) {
    // Parse caseId as integer
    const caseIdInt = parseInt(caseId, 10);
    
    // Check for valid integer
    if (isNaN(caseIdInt)) {
      throw new Error('Invalid medical case ID format');
    }
    
    const medicalCase = await prisma.medicalCase.findFirst({
      where: {
        id: caseIdInt,
        userId,
      },
    });

    if (!medicalCase) {
      throw new Error('Medical case not found or not owned by user');
    }

    return medicalCase;
  }

  async updateMedicalCase(caseId, userId, caseData) {
    // Parse caseId as integer
    const caseIdInt = parseInt(caseId, 10);
    console.log(caseData);
    console.log(caseIdInt);

    
    // Check for valid integer
    if (isNaN(caseIdInt)) {
      throw new Error('Invalid medical case ID format');
    }

    // Check if medical case exists and belongs to user
    const existingCase = await prisma.medicalCase.findFirst({
      where: {
        id: caseIdInt,
        userId,
      },
    });
  console.log(existingCase);
    if (!existingCase) {
      throw new Error('Medical case not found or not owned by user');
    }

    // Build update data object with only provided fields
    const updateData = {};
    
    // Only include fields that are provided and different from current values
    if (caseData.description !== undefined && caseData.description !== existingCase.description) {
      updateData.description = caseData.description;
    }
    
    // Handle image update separately
    if (caseData.image !== undefined && caseData.image !== existingCase.image) {
      updateData.image = caseData.image;
      
      // Delete old image file if it exists and is not the default
      if (existingCase.image && !existingCase.image.includes('default')) {
        try {
          const oldImagePath = path.join(__dirname, '../../../', existingCase.image);
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
      // No changes, return existing medical case
      return await prisma.medicalCase.findUnique({
        where: { id: caseIdInt },
      });
    }

    // Update medical case
    const updatedCase = await prisma.medicalCase.update({
      where: { id: caseIdInt },
      data: updateData,
    });

    return updatedCase;
  }

  async deleteMedicalCase(caseId, userId) {
    // Parse caseId as integer
    const caseIdInt = parseInt(caseId, 10);
    
    // Check for valid integer
    if (isNaN(caseIdInt)) {
      throw new Error('Invalid medical case ID format');
    }
    
    // Check if medical case exists and belongs to user
    const existingCase = await prisma.medicalCase.findFirst({
      where: {
        id: caseIdInt,
        userId,
      },
    });

    if (!existingCase) {
      throw new Error('Medical case not found or not owned by user');
    }

    // Delete the image file if it exists
    if (existingCase.image) {
      try {
        const imagePath = path.join(__dirname, '../../../', existingCase.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (error) {
        console.error('Error deleting medical case image:', error);
        // Continue with deletion even if file deletion fails
      }
    }

    // Delete medical case
    await prisma.medicalCase.delete({
      where: { id: caseIdInt },
    });

    return { message: 'Medical case deleted successfully' };
  }
}

module.exports = new MedicalCaseService();