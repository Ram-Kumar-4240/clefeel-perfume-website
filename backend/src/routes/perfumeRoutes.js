const express = require('express');
const router = express.Router();
const PerfumeController = require('../controllers/perfumeController');
const { requireAdmin } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Public routes
router.get('/', PerfumeController.getAll);
router.get('/featured', PerfumeController.getFeatured);
router.get('/:slug', PerfumeController.getBySlug);

// Admin routes
router.post('/', requireAdmin, upload.array('images', 5), PerfumeController.create);
router.get('/admin/all', requireAdmin, PerfumeController.getAllAdmin);
router.put('/:id', requireAdmin, upload.array('images', 5), PerfumeController.update);
router.delete('/:id', requireAdmin, PerfumeController.delete);

// Variant management
router.post('/:id/variants', requireAdmin, PerfumeController.addVariant);
router.put('/variants/:variantId', requireAdmin, PerfumeController.updateVariant);
router.delete('/variants/:variantId', requireAdmin, PerfumeController.deleteVariant);

module.exports = router;
