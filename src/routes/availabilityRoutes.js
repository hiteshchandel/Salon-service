const express = require('express');
const { authenticateToken } = require('../utils/jwt');
const {
    setAvailability,
    updateAvailability,
    deleteAvailability,
    getAllAvailability,
    getStaffAvailability,
    getAvailableSlots
} = require('../controllers/availabilityController');

const router = express.Router();

// 📌 Staff set availability
router.post('/', authenticateToken, setAvailability);

// 📌 Staff update availability
router.put('/:availabilityId', authenticateToken, updateAvailability);

// 📌 Staff delete availability
router.delete('/:availabilityId', authenticateToken, deleteAvailability);

// 📌 Get all availability (admin = all staff, staff = only self)
router.get('/', authenticateToken, getAllAvailability);

// 📌 Get staff active availability days (frontend: to load available days only)
router.get('/staff/active', authenticateToken, getStaffAvailability);

// 📌 View available slots for a given staffId + date + service
router.get('/:staffId/slots', authenticateToken, getAvailableSlots);

module.exports = router;
