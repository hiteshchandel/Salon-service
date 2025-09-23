const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const sequelize = require('../config/database');
const { generateToken } = require('../utils/jwt');

// User Registration
exports.registerUser = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { name, email, password, phone } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email }, transaction: t });
        if (existingUser) {
            await t.rollback();
            return res.status(400).json({ message: "Email already registered" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = await User.create(
            { name, email, password: hashedPassword, phone },
            { transaction: t }
        );

        await t.commit();

        // Remove password before sending response
        const { password: _, ...userWithoutPassword } = newUser.toJSON();

        return res.status(201).json({
            message: "User registered successfully",
            user: userWithoutPassword
        });
    } catch (error) {
        await t.rollback();
        console.error("❌ Error during signup:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

// User Login
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ where: { email:email.toLowerCase() } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate token
        const token = generateToken(user);

        // Remove password before sending response
        const { password: _, ...userWithoutPassword } = user.toJSON();

        return res.status(200).json({
            message: "Login successful",
            user: userWithoutPassword,
            token
        });
    } catch (error) {
        console.error("❌ Error during login:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
