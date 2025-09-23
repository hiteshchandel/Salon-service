// models/appointmentModel.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Appointment = sequelize.define('Appointment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    userId: { type: DataTypes.INTEGER, allowNull: false }, // customer
    staffId: { type: DataTypes.INTEGER, allowNull: true }, // assigned staff (nullable)
    serviceId: { type: DataTypes.INTEGER, allowNull: false },

    date: { type: DataTypes.DATEONLY, allowNull: false },   // YYYY-MM-DD
    startTime: { type: DataTypes.TIME, allowNull: false },  // '14:00:00'
    endTime: { type: DataTypes.TIME, allowNull: false },    // '15:00:00'

    duration: { type: DataTypes.INTEGER, allowNull: true }, // minutes (optional override)
    status: { type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show'), defaultValue: 'pending' },
    paymentStatus: { type: DataTypes.ENUM('pending', 'paid', 'refunded'), defaultValue: 'pending' },

    notes: { type: DataTypes.TEXT, allowNull: true },
    source: { type: DataTypes.ENUM('web', 'phone', 'walkin'), defaultValue: 'web' },

    cancellationReason: { type: DataTypes.TEXT, allowNull: true },
    rescheduledFromId: { type: DataTypes.INTEGER, allowNull: true } // link to previous appointment
}, {
    tableName: 'appointments',
    timestamps: true
});

module.exports = Appointment;
