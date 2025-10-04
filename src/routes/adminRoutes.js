const express = require('express');
const { authenticateToken } = require('../utils/jwt');
const { getAllUsers, getAllAppointments, getRevenueReport } = require('../controllers/adminController');
const router = express.Router();

// Admin: Manage users
router.get('/users', authenticateToken, getAllUsers);

// Admin: Manage appointments
router.get('/appointments', authenticateToken, getAllAppointments);

// GET /api/reports/revenue?filter=daily|weekly|monthly|yearly|all
router.get("/revenue", authenticateToken, getRevenueReport);

module.exports = router;
 