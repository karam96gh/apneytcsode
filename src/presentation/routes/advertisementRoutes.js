// src/presentation/routes/advertisementRoutes.js
const express = require('express');
const router = express.Router();
const advertisementController = require('../controllers/advertisementController');
const { authenticate, isVerified } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Public routes - لا تحتاج إلى مصادقة
// جلب الإعلانات النشطة (للعرض العام)
router.get('/active', advertisementController.getActiveAdvertisements);

// تسجيل نقرة على إعلان
router.post('/:id/click', advertisementController.recordClick);

// جلب إعلان محدد
router.get('/:id', advertisementController.getAdvertisementById);

// Admin routes - تحتاج إلى مصادقة
router.use(authenticate);

// جلب جميع الإعلانات (للأدمن)
router.get('/', advertisementController.getAllAdvertisements);

// إنشاء إعلان جديد - مع رفع صورة
router.post('/', upload.single('image'), advertisementController.createAdvertisement);

// تحديث إعلان - مع رفع صورة
router.put('/:id', upload.single('image'), advertisementController.updateAdvertisement);

// حذف إعلان
router.delete('/:id', advertisementController.deleteAdvertisement);

// جلب إحصائيات إعلان
router.get('/:id/stats', advertisementController.getAdvertisementStats);

// تنظيف الإعلانات المنتهية الصلاحية
router.post('/cleanup/expired', advertisementController.cleanupExpiredAds);

module.exports = router;