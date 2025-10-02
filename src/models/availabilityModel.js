// models/availabilityModel.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Availability = sequelize.define('Availability', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false }, // staff userId
    dayOfWeek: { type: DataTypes.INTEGER, allowNull: false }, // 0 = Sunday ... 6 = Saturday
    startTime: { type: DataTypes.TIME, allowNull: false },    // '09:00:00'
    endTime: { type: DataTypes.TIME, allowNull: false },      // '17:00:00'
    // slotLength: { type: DataTypes.INTEGER, defaultValue: 30 },// minutes
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
    tableName: 'availabilities',
    timestamps: true
});

module.exports = Availability;
