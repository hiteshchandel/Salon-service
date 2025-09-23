const express = require('express');
const { authenticateToken } = require('../utils/jwt');
const { getProfile, updateProfile } = require('../controllers/userController');
const router = express.Router();

// Get profile
router.get('/me', authenticateToken, getProfile);

// Update profile
router.put('/me', authenticateToken, updateProfile);

module.exports = router;
