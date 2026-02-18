const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const PerfumeController = require('../controllers/perfumeController');
const { requireAdmin } = require('../middleware/auth');
const { query } = require('../config/database');

// All admin routes require admin authentication
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', OrderController.getDashboardStats);
router.get('/dashboard/recent-orders', OrderController.getRecentOrders);

// Orders
router.get('/orders', OrderController.getAll);
router.put('/orders/:id/status', OrderController.updateStatus);

// Products
router.get('/perfumes', PerfumeController.getAllAdmin);

// Enquiries
router.get('/enquiries', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 100'
    );
    res.json({ enquiries: result.rows });
  } catch (error) {
    next(error);
  }
});

router.put('/enquiries/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await query(
      'UPDATE enquiries SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }
    
    res.json({ enquiry: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
