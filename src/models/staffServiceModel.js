// models/staffServiceModel.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StaffService = sequelize.define('StaffService', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    priceOverride: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    durationOverride: { type: DataTypes.INTEGER, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
    tableName: 'staff_services',
    timestamps: false
});

module.exports = StaffService;
