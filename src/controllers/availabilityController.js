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

        const { dayOfWeek, startTime, endTime, slotLength = 30, isActive = true } = req.body;

        // Validation
        if (dayOfWeek === undefined || !startTime || !endTime) {
            return res.status(400).json({ message: "dayOfWeek, startTime, and endTime are required" });
        }
        if (dayOfWeek < 0 || dayOfWeek > 6) {
            return res.status(400).json({ message: "dayOfWeek must be between 0 (Sunday) and 6 (Saturday)" });
        }

        // Create or update availability
        const [availability, created] = await Availability.findOrCreate({
            where: { userId: req.user.id, dayOfWeek },
            defaults: { startTime, endTime, slotLength, isActive }
        });

        if (!created) {
            availability.startTime = startTime;
            availability.endTime = endTime;
            availability.slotLength = slotLength;
            availability.isActive = isActive;
            await availability.save();
        }

        return res.status(200).json({
            message: created
                ? "Availability set successfully"
                : "Availability updated successfully",
            availability
        });
    } catch (error) {
        console.error("❌ Error setting availability:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};


// 📌 Get real-time available slots for a staff on a given date
exports.getAvailableSlots = async (req, res) => {
    try {
        const { staffId } = req.params;
        const { date, serviceId } = req.query; // date = 'YYYY-MM-DD'

        // Validate staff
        const staff = await User.findByPk(staffId);
        if (!staff || staff.role !== 'staff') {
            return res.status(404).json({ message: "Staff not found" });
        }

        // Get service
        const service = await Service.findByPk(serviceId);
        if (!service) return res.status(404).json({ message: "Service not found" });

        // Check if requested date is Sunday (0) or Tuesday (2)
        const dayOfWeek = new Date(date).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 2) return res.json({ slots: [] }); // Sunday & Tuesday off

        // Get staffService to check duration override
        const staffService = await StaffService.findOne({
            where: { userId: staffId, serviceId, isActive: true }
        });

        const slotDuration = staffService?.durationOverride || service.duration; // in minutes
        

        // Get staff availability for that day
        const availability = await Availability.findOne({
            where: { userId: staffId, dayOfWeek, isActive: true }
        });
        if (!availability) return res.json({ slots: [] });

        // Generate all possible slots
        const slots = [];
        let [h, m] = availability.startTime.split(':').map(Number);
        const [endH, endM] = availability.endTime.split(':').map(Number);

        while (h < endH || (h === endH && m < endM)) {
            const slotStart = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
            let endHour = h + Math.floor((m + slotDuration) / 60);
            let endMin = (m + slotDuration) % 60;
            const slotEnd = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00`;

            // Only push if slotEnd is before availability endTime
            if (endHour < endH || (endHour === endH && endMin <= endM)) {
                slots.push({ startTime: slotStart, endTime: slotEnd });
            }

            // move to next slot
            m += slotDuration;
            h += Math.floor(m / 60);
            m = m % 60;
        }

        // Fetch booked appointments for that staff on that date
        const bookedAppointments = await Appointment.findAll({
            where: {
                staffId,
                date,
                status: { [Op.not]: 'cancelled' }
            },
            attributes: ['startTime', 'endTime']
        });

        // Filter slots that are already booked
        const availableSlots = slots.filter(slot => {
            return !bookedAppointments.some(appointment =>
                (slot.startTime >= appointment.startTime && slot.startTime < appointment.endTime) ||
                (slot.endTime > appointment.startTime && slot.endTime <= appointment.endTime) ||
                (slot.startTime <= appointment.startTime && slot.endTime >= appointment.endTime)
            );
        });

        return res.status(200).json({ staffId, date, slots: availableSlots});
    } catch (error) {
        console.error("❌ Error getting available slots:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
