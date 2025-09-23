const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const Service = require('../models/serviceModel');
const StaffService = require('../models/staffServiceModel');

// 📌 Add a staff member (Admin only)
exports.addStaff = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access denied. Only admin can add staff." });
        }

        const { name, email, password, phone, bio } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required" });
        }

        // Check if staff already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, bcrypt.genSaltSync(10));

        // Create staff user
        const staff = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            role: 'staff',
            bio
        });

        return res.status(201).json({
            message: "Staff member added successfully",
            staff
        });
    } catch (error) {
        console.error("❌ Error adding staff:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

// 📌 Assign a service to a staff member (Admin only)
exports.assignServiceToStaff = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access denied. Only admin can assign services." });
        }

        const { staffId, serviceId } = req.params;
        const { priceOverride, durationOverride } = req.body;

        // Check if staff exists
        const staff = await User.findByPk(staffId);
        if (!staff || staff.role !== 'staff') {
            return res.status(404).json({ message: "Staff not found or invalid role" });
        }

        // Check if service exists
        const service = await Service.findByPk(serviceId);
        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        // Create or update assignment
        const assignment = await StaffService.findOrCreate({
            where: { userId: staffId, serviceId },
            defaults: { priceOverride, durationOverride, isActive: true }
        });

        // If already exists, update overrides
        if (!assignment[1]) {
            assignment[0].priceOverride = priceOverride ?? assignment[0].priceOverride;
            assignment[0].durationOverride = durationOverride ?? assignment[0].durationOverride;
            await assignment[0].save();
        }

        return res.status(200).json({
            message: "Service assigned to staff successfully",
            staffId,
            serviceId
        });
    } catch (error) {
        console.error("❌ Error assigning service to staff:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

// 📌 Get all staff profiles (Public)
exports.getStaffProfiles = async (req, res) => {
    try {
        const staffProfiles = await User.findAll({
            where: { role: 'staff' },
            attributes: ['id', 'name', 'email', 'phone', 'bio', 'avgRating'],
            include: [
                {
                    model: Service,
                    through: { attributes: ['priceOverride', 'durationOverride', 'isActive'] }
                }
            ]
        });

        return res.status(200).json({ staff: staffProfiles });
    } catch (error) {
        console.error("❌ Error fetching staff profiles:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
