// src/application/services/advertisementService.js
const prisma = require('../../infrastructure/database/prismaClient');
const fs = require('fs');
const path = require('path');

class AdvertisementService {
  async createAdvertisement(adData) {
    const { image, link, startDate, endDate, priority } = adData;

    // التحقق من وجود الصورة (مطلوبة)
    if (!image) {
      throw new Error('Image is required');
    }

    // التحقق من أن تاريخ الانتهاء في المستقبل
    const endDateTime = new Date(endDate);
    if (endDateTime <= new Date()) {
      throw new Error('End date must be in the future');
    }

    // إنشاء الإعلان
    const advertisement = await prisma.advertisement.create({
      data: {
        image,
        link,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDateTime,
        priority: priority ? parseInt(priority, 10) : 1, // Convert to integer
      },
    });

    return advertisement;
  }

  async getAllAdvertisements(filters = {}) {
    const { isActive, includeExpired = false } = filters;

    // بناء شروط الفلترة
    const where = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // إضافة شرط عدم انتهاء الإعلان إذا لم يكن مطلوب عرض المنتهية
    if (!includeExpired) {
      where.endDate = {
        gte: new Date(),
      };
    }

    // جلب الإعلانات
    const advertisements = await prisma.advertisement.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return advertisements;
  }

  async getActiveAdvertisements() {
    // جلب الإعلانات النشطة وغير المنتهية فقط
    const currentDate = new Date();
    
    const advertisements = await prisma.advertisement.findMany({
      where: {
        isActive: true,
        startDate: {
          lte: currentDate,
        },
        endDate: {
          gte: currentDate,
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // زيادة عدد المشاهدات لكل إعلان
    if (advertisements.length > 0) {
      const adIds = advertisements.map(ad => ad.id);
      await prisma.advertisement.updateMany({
        where: {
          id: {
            in: adIds,
          },
        },
        data: {
          views: {
            increment: 1,
          },
        },
      });
    }

    return advertisements;
  }

  async getAdvertisementById(adId) {
    const advertisement = await prisma.advertisement.findUnique({
      where: {
        id: adId,
      },
    });

    if (!advertisement) {
      throw new Error('Advertisement not found');
    }

    return advertisement;
  }

  async updateAdvertisement(adId, adData) {
    const { image, link, startDate, endDate, priority, isActive } = adData;

    // التحقق من وجود الإعلان
    const existingAd = await prisma.advertisement.findUnique({
      where: {
        id: adId,
      },
    });

    if (!existingAd) {
      throw new Error('Advertisement not found');
    }

    // بناء بيانات التحديث
    const updateData = {};

    if (link !== undefined) updateData.link = link;
    if (priority !== undefined) updateData.priority = parseInt(priority, 10); // Convert to integer
    if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true; // Convert to boolean

    // التعامل مع تحديث الصورة
    if (image !== undefined) {
      updateData.image = image;
      
      // حذف الصورة القديمة إذا كانت موجودة
      if (existingAd.image && !existingAd.image.includes('default')) {
        try {
          const oldImagePath = path.join(__dirname, '../../../', existingAd.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
    }

    // التعامل مع التواريخ
    if (startDate !== undefined) {
      updateData.startDate = new Date(startDate);
    }

    if (endDate !== undefined) {
      const endDateTime = new Date(endDate);
      if (endDateTime <= new Date()) {
        throw new Error('End date must be in the future');
      }
      updateData.endDate = endDateTime;
    }

    // تحديث الإعلان
    const updatedAd = await prisma.advertisement.update({
      where: { id: adId },
      data: updateData,
    });

    return updatedAd;
  }

  async deleteAdvertisement(adId) {
    // التحقق من وجود الإعلان
    const existingAd = await prisma.advertisement.findUnique({
      where: {
        id: adId,
      },
    });

    if (!existingAd) {
      throw new Error('Advertisement not found');
    }

    // حذف ملف الصورة إذا كان موجود
    if (existingAd.image && !existingAd.image.includes('default')) {
      try {
        const imagePath = path.join(__dirname, '../../../', existingAd.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (error) {
        console.error('Error deleting advertisement image:', error);
      }
    }

    // حذف الإعلان
    await prisma.advertisement.delete({
      where: { id: adId },
    });

    return { message: 'Advertisement deleted successfully' };
  }

  async recordClick(adId) {
    // التحقق من وجود الإعلان والتأكد من أنه نشط
    const advertisement = await prisma.advertisement.findFirst({
      where: {
        id: adId,
        isActive: true,
        startDate: {
          lte: new Date(),
        },
        endDate: {
          gte: new Date(),
        },
      },
    });

    if (!advertisement) {
      throw new Error('Advertisement not found or expired');
    }

    // زيادة عدد النقرات
    const updatedAd = await prisma.advertisement.update({
      where: { id: adId },
      data: {
        clicks: {
          increment: 1,
        },
      },
    });

    return {
      link: advertisement.link,
      clicks: updatedAd.clicks,
    };
  }

  async getAdvertisementStats(adId) {
    const advertisement = await prisma.advertisement.findUnique({
      where: {
        id: adId,
      },
      select: {
        id: true,
        clicks: true,
        views: true,
        isActive: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      },
    });

    if (!advertisement) {
      throw new Error('Advertisement not found');
    }

    // حساب معدل النقر (CTR)
    const ctr = advertisement.views > 0 ? (advertisement.clicks / advertisement.views * 100).toFixed(2) : 0;

    return {
      ...advertisement,
      ctr: parseFloat(ctr),
      isExpired: new Date() > advertisement.endDate,
    };
  }

  // دالة لتنظيف الإعلانات المنتهية الصلاحية (يمكن تشغيلها بشكل دوري)
  async cleanupExpiredAds() {
    const expiredAds = await prisma.advertisement.findMany({
      where: {
        endDate: {
          lt: new Date(),
        },
        isActive: true,
      },
    });

    if (expiredAds.length > 0) {
      await prisma.advertisement.updateMany({
        where: {
          endDate: {
            lt: new Date(),
          },
        },
        data: {
          isActive: false,
        },
      });
    }

    return { deactivated: expiredAds.length };
  }
}

module.exports = new AdvertisementService();