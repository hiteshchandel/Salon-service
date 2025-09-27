const express = require('express');
const { authenticateToken } = require('../utils/jwt');
const { getProfile, updateUser,  } = require('../controllers/userController');
const router = express.Router();

// Get profile
router.get('/me', authenticateToken, getProfile);

// Update profile
router.put('/:userId', authenticateToken, updateUser);

module.exports = router;
