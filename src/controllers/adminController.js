const User = require('../models/userModel');
const Appointment = require('../models/appointmentModel');
const Service = require('../models/serviceModel');
const Staff = require('../models/staffServiceModel');
// 📌 Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        const users = await User.findAll({
            attributes: ["id", "name", "email", "phone", "role", "createdAt"],
            order: [["createdAt", "DESC"]],
        });

        return res.status(200).json({ users });
    } catch (error) {
        console.error("❌ Error fetching users:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// 📌 Get all appointments (Admin only)
exports.getAllAppointments = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        const appointments = await Appointment.findAll({
            include: [
                { model: User, as: "Customer", attributes: ["id", "name", "email", "phone"] },
                { model: User, as: "Staff", attributes: ["id", "name", "email", "phone"] },
                { model: Service, attributes: ["id", "name", "price", "duration"] },
            ],
            order: [["date", "DESC"], ["startTime", "DESC"]], // use correct field names
        });

        return res.status(200).json({ appointments });
    } catch (error) {
        console.error("❌ Error fetching appointments:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

