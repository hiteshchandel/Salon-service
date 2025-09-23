const express = require('express');
const { authenticateToken } = require('../utils/jwt');
const { addReview, getReviews, staffRespondReview } = require('../controllers/reviewController');
const router = express.Router();

// Add review
router.post('/', authenticateToken, addReview);

// Get reviews (filter by service/staff/appointment)
router.get('/', getReviews);

// Staff respond
router.put('/:id/respond', authenticateToken, staffRespondReview);

module.exports = router;
