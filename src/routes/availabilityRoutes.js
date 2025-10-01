const express = require('express');
const { authenticateToken } = require('../utils/jwt');
const {
    setAvailability,
    updateAvailability,
    deleteAvailability,
    getAllAvailability,
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

// 📌 View availability slots (for a given staffId and date/service)
router.get('/:staffId/slots', getAvailableSlots);

module.exports = router;
