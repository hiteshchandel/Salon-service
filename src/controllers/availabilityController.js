const User = require('../models/userModel');
const Availability = require('../models/availabilityModel');

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

// 📌 View availability for a staff member
exports.getAvailability = async (req, res) => {
    try {
        const { staffId } = req.params;

        const staff = await User.findByPk(staffId);
        if (!staff || staff.role !== 'staff') {
            return res.status(404).json({ message: "Staff not found" });
        }

        const availability = await Availability.findAll({
            where: { userId: staffId },
            attributes: ['dayOfWeek', 'startTime', 'endTime', 'slotLength', 'isActive'],
            order: [['dayOfWeek', 'ASC']]
        });

        return res.status(200).json({
            staffId,
            staffName: staff.name,
            availability
        });
    } catch (error) {
        console.error("❌ Error fetching availability:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
