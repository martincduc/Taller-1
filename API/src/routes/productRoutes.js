const express = require('express');
const router = express.Router();
const controller = require('../controllers/productController');
router.get('/', controller.getAllProducts);
module.exports = router;