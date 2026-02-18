const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../middleware/validation');
const { requireAuth } = require('../middleware/auth');

// Public routes
router.post('/register', registerValidation, AuthController.register);
router.post('/login', loginValidation, AuthController.login);
router.post('/google', AuthController.googleAuth);
router.get('/verify/:token', AuthController.verifyEmail);

// Protected routes
router.get('/me', requireAuth, AuthController.getMe);
router.put('/profile', requireAuth, AuthController.updateProfile);
router.get('/orders', requireAuth, AuthController.getOrderHistory);
router.post('/logout', requireAuth, AuthController.logout);

module.exports = router;
