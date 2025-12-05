const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Rutas Públicas
router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);

// Ruta Protegida
router.put('/profile', authMiddleware, controller.updateProfile);

module.exports = router;