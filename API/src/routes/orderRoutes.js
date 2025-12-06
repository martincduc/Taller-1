const express = require('express');
const router = express.Router();
const controller = require('../controllers/orderController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, controller.createOrder);
router.get('/mine', auth, controller.getMyOrders);
router.patch('/:id', auth, controller.updateOrderStatus);


router.patch('/:id/cancel', auth, controller.cancelOrder);

module.exports = router;