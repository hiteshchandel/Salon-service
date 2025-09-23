const Review  = require("../models/reviewModel");

// Add a new review (by customer)
exports.addReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { staffId, serviceId, appointmentId, rating, comment, reviewType } = req.body;

        const review = await Review.create({
            userId,
            staffId: staffId || null,
            serviceId: serviceId || null,
            appointmentId: appointmentId || null,
            rating,
            comment,
            reviewType: reviewType || "service",
        });

        return res.status(201).json({
            message: "Review added successfully",
            review,
        });
    } catch (error) {
        console.error("❌ Error adding review:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Get reviews (optionally filter by service, staff, or appointment)
exports.getReviews = async (req, res) => {
    try {
        const { serviceId, staffId, appointmentId } = req.query;

        const filters = {};
        if (serviceId) filters.serviceId = serviceId;
        if (staffId) filters.staffId = staffId;
        if (appointmentId) filters.appointmentId = appointmentId;

        const reviews = await Review.findAll({
            where: filters,
            order: [["createdAt", "DESC"]],
        });

        return res.status(200).json({ reviews });
    } catch (error) {
        console.error("❌ Error fetching reviews:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Staff responds to a review
exports.staffRespondReview = async (req, res) => {
    try {
        const staffId = req.user.id;
        const reviewId = req.params.id;
        const { staffResponse } = req.body;

        const review = await Review.findOne({ where: { id: reviewId, staffId } });
        if (!review) {
            return res.status(404).json({ message: "Review not found or not authorized" });
        }

        review.staffResponse = staffResponse;
        await review.save();

        return res.status(200).json({
            message: "Response added successfully",
            review,
        });
    } catch (error) {
        console.error("❌ Error responding to review:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};
