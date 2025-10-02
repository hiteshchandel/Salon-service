const express = require('express');
const { authenticateToken } = require('../utils/jwt');
const { getAppointmentById, getAppointments, updateAppointment, cancelAppointment, createOrder, verifyPayment } = require('../controllers/appointmentController');
const router = express.Router();

// 📌 Create Razorpay order + draft appointment
router.post('/create-order',authenticateToken, createOrder);

// 📌 Verify payment after Razorpay success
router.post('/verify-payment', authenticateToken, verifyPayment);

// 📌 Get all appointments (user sees own, admin sees all)
router.get('/', authenticateToken, getAppointments);

// 📌 Update / reschedule appointment
router.put('/:id',authenticateToken, updateAppointment);

// 📌 Cancel appointment
router.delete('/:id', authenticateToken, cancelAppointment);

// Get appointment by ID
router.get("/:id", authenticateToken, getAppointmentById);

module.exports = router;
