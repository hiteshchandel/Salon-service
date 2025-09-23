const express = require('express');
const { authenticateToken } = require('../utils/jwt');
const { addStaff, assignServiceToStaff, getStaffProfiles } = require('../controllers/staffController');
const router = express.Router();

// Admin: Add staff
router.post('/', authenticateToken, addStaff);

// Assign service to staff
router.post('/:staffId/services/:serviceId', authenticateToken, assignServiceToStaff);

// Get staff profiles
router.get('/', getStaffProfiles);

module.exports = router;
