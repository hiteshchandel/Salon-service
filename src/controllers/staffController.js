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

        // Create or update assignment (only isActive now)
        const [assignment, created] = await StaffService.findOrCreate({
            where: { userId: staffId, serviceId },
            defaults: { isActive: true }
        });

        if (!created) {
            assignment.isActive = true; // re-activate if it was inactive
            await assignment.save();
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

// Get all staff with their assigned services
exports.getStaffProfiles = async (req, res) => {
    try {
        const staff = await User.findAll({
            where: { role: 'staff' },
            include: [
                {
                    model: Service,
                    as: 'Services', // ✅ must match the alias defined in associations
                    through: { attributes: [] } // hide join table
                }
            ]
        });

        return res.status(200).json({ staff });
    } catch (err) {
        console.error('❌ Error fetching staff profiles:', err);
        return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};


// 📌 Delete a staff member (Admin only)
exports.deleteStaff = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access denied. Only admin can delete staff." });
        }

        const { staffId } = req.params;

        const staff = await User.findByPk(staffId);
        if (!staff || staff.role !== 'staff') {
            return res.status(404).json({ message: "Staff not found" });
        }

        await staff.destroy();

        return res.status(200).json({ message: "Staff deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting staff:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

// 📌 Get staff assigned to a specific service (Public)
exports.getStaffByService = async (req, res) => {
    try {
        const { serviceId } = req.query;
        if (!serviceId) {
            return res.status(400).json({ message: "serviceId is required" });
        }

        const staffServices = await StaffService.findAll({
            where: { serviceId, isActive: true },
            include: [
                {
                    model: User,
                    attributes: ["id", "name", "email", "phone", "bio", "avgRating"],
                    where: { role: "staff" }
                },
                {
                    model: Service,
                    attributes: ["id", "name", "duration", "price"]
                }
            ]
        });

        const staffList = staffServices.map(ss => ({
            id: ss.User.id,
            name: ss.User.name,
            email: ss.User.email,
            phone: ss.User.phone,
            bio: ss.User.bio,
            avgRating: ss.User.avgRating,
            service: {
                id: ss.Service.id,
                name: ss.Service.name,
                price: ss.Service.price,   // always from service
                duration: ss.Service.duration // always from service
            }
        }));

        return res.status(200).json(staffList);
    } catch (error) {
        console.error("❌ Error fetching staff by service:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};


// Get all services assigned to a staff
exports.getStaffServices = async (req, res) => {
    try {
        const { staffId } = req.params;

        // Check if staff exists
        const staff = await User.findByPk(staffId);
        if (!staff || staff.role !== "staff") {
            return res.status(404).json({ message: "Staff not found" });
        }

        // Fetch assigned services (many-to-many through StaffService)
        const assignedServices = await Service.findAll({
            include: [
                {
                    model: User,
                    as: "Staffs",
                    where: { id: staffId },
                    attributes: []
                }
            ]
        });

        return res.status(200).json({ services: assignedServices });
    } catch (err) {
        console.error("❌ Error fetching staff services:", err);
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
};