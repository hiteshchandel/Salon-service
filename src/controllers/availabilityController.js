const Availability = require('../models/availabilityModel');
const Appointment = require('../models/appointmentModel');
const StaffService = require('../models/staffServiceModel');
const Service = require('../models/serviceModel');
const User = require('../models/userModel');
const { Op } = require('sequelize');

// 📌 Staff set availability
exports.setAvailability = async (req, res) => {
    try {
        if (req.user.role !== 'staff') {
            return res.status(403).json({ message: "Only staff can set availability" });
        }

        const { dayOfWeek, startTime, endTime, isActive = true } = req.body;

        if (dayOfWeek === undefined || !startTime || !endTime) {
            return res.status(400).json({ message: "dayOfWeek, startTime, and endTime are required" });
        }
        if (dayOfWeek < 0 || dayOfWeek > 6) {
            return res.status(400).json({ message: "dayOfWeek must be between 0 (Sunday) and 6 (Saturday)" });
        }

        const [availability, created] = await Availability.findOrCreate({
            where: { userId: req.user.id, dayOfWeek },
            defaults: { startTime, endTime, isActive }
        });

        if (!created) {
            availability.startTime = startTime;
            availability.endTime = endTime;
            availability.isActive = isActive;
            await availability.save();
        }

        return res.status(200).json({
            message: created ? "Availability set successfully" : "Availability updated successfully",
            availability
        });
    } catch (error) {
        console.error("❌ Error setting availability:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// 📌 Update availability (staff only)
exports.updateAvailability = async (req, res) => {
    try {
        if (req.user.role !== 'staff') {
            return res.status(403).json({ message: "Only staff can update availability" });
        }

        const { availabilityId } = req.params;
        const { startTime, endTime, isActive } = req.body;

        const availability = await Availability.findOne({
            where: { id: availabilityId, userId: req.user.id }
        });

        if (!availability) {
            return res.status(404).json({ message: "Availability not found" });
        }

        if (startTime) availability.startTime = startTime;
        if (endTime) availability.endTime = endTime;
        if (isActive !== undefined) availability.isActive = isActive;

        await availability.save();

        return res.status(200).json({ message: "Availability updated successfully", availability });
    } catch (error) {
        console.error("❌ Error updating availability:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// 📌 Delete availability (staff only)
exports.deleteAvailability = async (req, res) => {
    try {
        if (req.user.role !== 'staff') {
            return res.status(403).json({ message: "Only staff can delete availability" });
        }

        const { availabilityId } = req.params;

        const availability = await Availability.findOne({
            where: { id: availabilityId, userId: req.user.id }
        });

        if (!availability) {
            return res.status(404).json({ message: "Availability not found" });
        }

        await availability.destroy();

        return res.status(200).json({ message: "Availability deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting availability:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// 📌 Get all availability (admin or staff for self)
exports.getAllAvailability = async (req, res) => {
    try {
        let whereCondition = {};

        if (req.user.role === 'staff') {
            whereCondition.userId = req.user.id;
        }

        const availability = await Availability.findAll({
            where: whereCondition,
            include: [{ model: User, attributes: ['id', 'name', 'email'] }]
        });

        return res.status(200).json({ availability });
    } catch (error) {
        console.error("❌ Error fetching availability:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// 📌 Get staff availability (only active days)
exports.getStaffAvailability = async (req, res) => {
    try {
        const { staffId } = req.query;

        if (!staffId) return res.status(400).json({ message: "staffId is required" });

        const availability = await Availability.findAll({
            where: { userId: staffId, isActive: true }, // ✅ only active days
            attributes: ["dayOfWeek", "startTime", "endTime"]
        });

        return res.status(200).json({ availability });
    } catch (error) {
        console.error("❌ Error fetching staff availability:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// 📌 Get available slots for staff + service + date
exports.getAvailableSlots = async (req, res) => {
    try {
        const { staffId } = req.params;
        const { date, serviceId } = req.query;

        if (!staffId || !date || !serviceId) {
            return res.status(400).json({ message: "staffId, date, and serviceId are required" });
        }

        const staff = await User.findByPk(staffId);
        if (!staff || staff.role !== "staff") return res.status(404).json({ message: "Staff not found" });

        const service = await Service.findByPk(serviceId);
        if (!service) return res.status(404).json({ message: "Service not found" });

        const dayOfWeek = new Date(date).getDay();

        // Check if staff is assigned to service
        const staffService = await StaffService.findOne({
            where: { userId: staffId, serviceId, isActive: true }
        });
        if (!staffService) return res.status(404).json({ message: "Staff is not assigned to this service" });

        // Check if staff is available on this day
        const availability = await Availability.findOne({
            where: { userId: staffId, dayOfWeek, isActive: true }
        });
        if (!availability) return res.json({ slots: [] }); // ✅ no availability, return empty

        // Generate slots
        const slotDuration = service.duration;
        const slots = [];
        let [h, m] = availability.startTime.split(":").map(Number);
        const [endH, endM] = availability.endTime.split(":").map(Number);

        while (h < endH || (h === endH && m < endM)) {
            const slotStart = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
            const endHour = h + Math.floor((m + slotDuration) / 60);
            const endMin = (m + slotDuration) % 60;
            const slotEnd = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}:00`;

            if (endHour < endH || (endHour === endH && endMin <= endM)) {
                slots.push({ startTime: slotStart, endTime: slotEnd, display: `${slotStart.slice(0, 5)} - ${slotEnd.slice(0, 5)}`, booked: false });
            }

            m += slotDuration;
            h += Math.floor(m / 60);
            m = m % 60;
        }

        // Remove already booked slots
        const bookedAppointments = await Appointment.findAll({
            where: { staffId, date, status: { [Op.not]: "cancelled" } },
            attributes: ["startTime", "endTime"]
        });

        const availableSlots = slots.filter(slot => {
            return !bookedAppointments.some(appt =>
                (slot.startTime >= appt.startTime && slot.startTime < appt.endTime) ||
                (slot.endTime > appt.startTime && slot.endTime <= appt.endTime) ||
                (slot.startTime <= appt.startTime && slot.endTime >= appt.endTime)
            );
        });

        return res.status(200).json({ staffId, date, slots: availableSlots });

    } catch (err) {
        console.error("❌ Error getting available slots:", err);
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
};


