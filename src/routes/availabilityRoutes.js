const express = require('express');
const { authenticateToken } = require('../utils/jwt');
const { setAvailability, getAvailableSlots } = require('../controllers/availabilityController');
const router = express.Router();

// Staff set availability
router.post('/', authenticateToken, setAvailability);

// View availability slotes (staffId required)
router.get('/:staffId', getAvailableSlots);

module.exports = router;
