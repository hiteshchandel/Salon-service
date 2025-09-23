const User = require('../models/userModel');

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] } // don’t return password
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ user });
    } catch (error) {
        console.error("❌ Error fetching profile:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, email, mobile } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // update only if provided
        if (name) user.name = name;
        if (email) user.email = email;
        if (mobile) user.mobile = mobile;

        await user.save();

        const { password, ...userWithoutPassword } = user.toJSON();

        return res.status(200).json({
            message: "Profile updated successfully",
            user: userWithoutPassword
        });
    } catch (error) {
        console.error("❌ Error updating profile:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
