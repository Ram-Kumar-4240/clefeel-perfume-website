const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { createOrderValidation } = require('../middleware/validation');

// Create order (Buy Now - supports guest checkout)
router.post('/', optionalAuth, createOrderValidation, OrderController.create);

// Create order from cart (requires auth)
router.post('/from-cart', requireAuth, OrderController.createFromCart);

// Get my orders (requires auth)
router.get('/my-orders', requireAuth, OrderController.getMyOrders);

// Get order by ID (requires auth)
router.get('/:id', requireAuth, OrderController.getById);

module.exports = router;
