const express = require('express');
const { authenticateToken } = require('../utils/jwt');
const { addStaff, assignServiceToStaff, getStaffProfiles, deleteStaff, getStaffByService, getStaffServices } = require('../controllers/staffController');
const router = express.Router();

// Admin: Add staff
router.post('/', authenticateToken, addStaff);

// Assign service to staff
router.post('/:staffId/services/:serviceId', authenticateToken, assignServiceToStaff);

router.get('/staffByService', getStaffByService);

// Get staff profiles
router.get('/', getStaffProfiles);

router.delete('/:staffId', authenticateToken, deleteStaff);

// Get assigned services for a staff
router.get('/:staffId/services', authenticateToken, getStaffServices);


module.exports = router;
