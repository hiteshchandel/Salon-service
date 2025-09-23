const express = require('express');
const { authenticateToken } = require('../utils/jwt');
const { createOrder, verifyPayment } = require('../controllers/paymentController');
const router = express.Router();

// Create Razorpay order
router.post('/order', authenticateToken, createOrder);

// Verify payment signature
router.post('/verify', authenticateToken, verifyPayment);

module.exports = router;
