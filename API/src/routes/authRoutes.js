const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

console.log("--> Rutas Auth cargadas"); // LOG PARA DEPURAR

// Rutas Públicas
router.post('/register', controller.register);
router.post('/login', controller.login);

// Ruta Protegida para Perfil (PUT)
router.put('/profile', authMiddleware, controller.updateProfile);

module.exports = router;