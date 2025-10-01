const express = require('express');
const { authenticateToken } = require('../utils/jwt');
const { addStaff, assignServiceToStaff, getStaffProfiles, deleteStaff, getStaffByService } = require('../controllers/staffController');
const router = express.Router();

// Admin: Add staff
router.post('/', authenticateToken, addStaff);

// Assign service to staff
router.post('/:staffId/services/:serviceId', authenticateToken, assignServiceToStaff);

router.get('/staffByService', getStaffByService);

// Get staff profiles
router.get('/', getStaffProfiles);

router.delete('/:staffId', authenticateToken, deleteStaff);

module.exports = router;
