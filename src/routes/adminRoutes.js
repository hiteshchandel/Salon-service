const express = require('express');
const { authenticateToken } = require('../utils/jwt');
const { getAllUsers, getAllAppointments } = require('../controllers/adminController');
const router = express.Router();

// Admin: Manage users
router.get('/users', authenticateToken, getAllUsers);

// Admin: Manage appointments
router.get('/appointments', authenticateToken, getAllAppointments);

module.exports = router;
 