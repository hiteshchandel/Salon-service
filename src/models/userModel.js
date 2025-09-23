// models/userModel.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false }, // hashed
    phone: { type: DataTypes.STRING, allowNull: true },
    role: { type: DataTypes.ENUM('customer', 'staff', 'admin'), defaultValue: 'customer' },
    bio: { type: DataTypes.TEXT, allowNull: true },          // for staff (specialization, yrs experience)
    avgRating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0.0 }, // computed from reviews
    preferences: { type: DataTypes.JSON, allowNull: true }  // e.g. { notifications: { email: true } }
}, {
    tableName: 'users',
    timestamps: true
});

module.exports = User;
