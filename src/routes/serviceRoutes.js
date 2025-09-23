const express = require('express');
const { authenticateToken } = require('../utils/jwt');
const { createService, getServices, updateService, deleteService } = require('../controllers/serviceController');
const router = express.Router();

// Public: Get all services
router.get('/', getServices);

// Admin: Create, Update, Delete
router.post('/', authenticateToken, createService);
router.put('/:id', authenticateToken, updateService);
router.delete('/:id', authenticateToken, deleteService);

module.exports = router;
