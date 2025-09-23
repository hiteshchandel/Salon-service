const Service = require('../models/serviceModel');

// 📌 Get all services (public)
exports.getServices = async (req, res) => {
    try {
        const services = await Service.findAll({ where: { active: true } });
        return res.status(200).json({ services });
    } catch (error) {
        console.error("❌ Error fetching services:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

// 📌 Create a new service (admin only)
exports.createService = async (req, res) => {
    try {
        // check role
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access denied. Only admin can create services." });
        }

        const { name, slug, description, duration, price } = req.body;

        if (!name || !duration || !price) {
            return res.status(400).json({ message: "Name, duration, and price are required" });
        }

        const newService = await Service.create({
            name,
            slug,
            description,
            duration,
            price,
            active: true
        });

        return res.status(201).json({
            message: "Service created successfully",
            service: newService
        });
    } catch (error) {
        console.error("❌ Error creating service:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

// 📌 Update a service (admin only)
exports.updateService = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access denied. Only admin can update services." });
        }

        const serviceId = req.params.id;
        const { name, slug, description, duration, price, active } = req.body;

        const service = await Service.findByPk(serviceId);
        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        if (name !== undefined) service.name = name;
        if (slug !== undefined) service.slug = slug;
        if (description !== undefined) service.description = description;
        if (duration !== undefined) service.duration = duration;
        if (price !== undefined) service.price = price;
        if (active !== undefined) service.active = active;

        await service.save();

        return res.status(200).json({
            message: "Service updated successfully",
            service
        });
    } catch (error) {
        console.error("❌ Error updating service:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

// 📌 Delete a service (admin only)
exports.deleteService = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access denied. Only admin can delete services." });
        }

        const serviceId = req.params.id;

        const service = await Service.findByPk(serviceId);
        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        await service.destroy();

        return res.status(200).json({ message: "Service deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting service:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
