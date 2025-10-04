const User = require('../models/userModel');
const Appointment = require('../models/appointmentModel');
const Service = require('../models/serviceModel');
const Staff = require('../models/staffServiceModel');
const Payment = require('../models/paymentModel');
const { Op, fn, col, literal } = require("sequelize");
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

exports.getRevenueReport = async (req, res) => {
    try {
        let { filter } = req.query;
        filter = filter || "all";

        let startDate;
        const today = new Date();

        switch (filter) {
            case "daily":
                startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                break;
            case "weekly":
                const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
                startDate = new Date(today);
                startDate.setDate(today.getDate() - dayOfWeek);
                break;
            case "monthly":
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case "yearly":
                startDate = new Date(today.getFullYear(), 0, 1);
                break;
            case "all":
            default:
                startDate = null;
                break;
        }

        const whereCondition = startDate
            ? { date: { [Op.gte]: startDate } }
            : {};

        // Fetch appointments with payment info
        const appointments = await Appointment.findAll({
            where: whereCondition,
            include: [
                { model: Payment, attributes: ["amount", "status"] },
                { model: Service, attributes: ["name", "price"] },
                { model: User, as: "Customer", attributes: ["id", "name"] },
                { model: User, as: "Staff", attributes: ["id", "name"] }
            ],
            order: [["date", "ASC"], ["startTime", "ASC"]]
        });

        // Now
        const now = new Date();

        // Counters
        let totalConfirmed = 0;
        let totalRevenue = 0;
        let totalCompleted = 0;

        appointments.forEach(app => {
            // ✅ Total confirmed appointments
            if (app.status === "confirmed") {
                totalConfirmed++;
            }

            // ✅ Total payment captured
            if (app.Payment && app.Payment.status === "captured") {
                totalRevenue += parseFloat(app.Payment.amount);
            }

            // ✅ Completed appointments (appointment datetime < now)
            const appointmentDateTime = new Date(`${app.date}T${app.startTime}`);
            if (appointmentDateTime < now) {
                totalCompleted++;
            }
        });

        res.json({
            filter,
            totalAppointments: appointments.length,
            totalConfirmedAppointments: totalConfirmed,
            totalCompletedAppointments: totalCompleted,
            totalRevenue,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to generate report", error: err.message });
    }
};
