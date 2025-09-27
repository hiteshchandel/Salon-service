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

// 📌 Update any user or staff profile
exports.updateUser = async (req, res) => {
    try {
        const { userId } = req.params; // optional: if admin wants to update another user
        const { name, email, mobile, phone, bio } = req.body;

        let targetUser;

        // Admin can update any user by userId, else update self
        if (req.user.role === 'admin' && userId) {
            targetUser = await User.findByPk(userId);
        } else {
            targetUser = await User.findByPk(req.user.id);
        }

        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Regular users (non-admin) cannot update other users
        if (req.user.role !== 'admin' && targetUser.id !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
        }

        // Update fields if provided
        if (name) targetUser.name = name;
        if (email) targetUser.email = email;
        if (mobile) targetUser.mobile = mobile;  // for regular user
        if (phone) targetUser.phone = phone;    // for staff
        if (bio) targetUser.bio = bio;          // for staff

        await targetUser.save();

        return res.status(200).json({
            message: "User updated successfully",
            user: targetUser
        });

    } catch (error) {
        console.error("❌ Error updating user:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
