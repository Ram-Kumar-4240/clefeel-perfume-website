const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cartController');
const { requireAuth } = require('../middleware/auth');
const { addToCartValidation } = require('../middleware/validation');

// All cart routes require authentication
router.use(requireAuth);

router.get('/', CartController.getCart);
router.get('/count', CartController.getCount);
router.get('/validate', CartController.validateStock);
router.post('/', addToCartValidation, CartController.addItem);
router.put('/:cartId', CartController.updateQuantity);
router.delete('/:cartId', CartController.removeItem);
router.delete('/', CartController.clearCart);

module.exports = router;
