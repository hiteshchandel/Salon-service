const express = require('express');
const { authenticateToken } = require('../utils/jwt');
const { setAvailability, getAvailability } = require('../controllers/availabilityController');
const router = express.Router();

// Staff set availability
router.post('/', authenticateToken, setAvailability);

// View availability (staffId required)
router.get('/:staffId', getAvailability);

module.exports = router;
