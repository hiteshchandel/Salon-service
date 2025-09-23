// // models/notificationModel.js
// const { DataTypes } = require('sequelize');
// const sequelize = require('../config/database');

// const Notification = sequelize.define('Notification', {
//     id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
//     userId: { type: DataTypes.INTEGER, allowNull: true },
//     appointmentId: { type: DataTypes.INTEGER, allowNull: true },
//     channel: { type: DataTypes.ENUM('email', 'sms', 'push'), defaultValue: 'email' },
//     type: { type: DataTypes.STRING, allowNull: false }, // 'appointment_reminder','payment_success', etc.
//     payload: { type: DataTypes.JSON, allowNull: true },
//     status: { type: DataTypes.ENUM('pending', 'sent', 'failed'), defaultValue: 'pending' },
//     sentAt: { type: DataTypes.DATE, allowNull: true },
//     retryCount: { type: DataTypes.INTEGER, defaultValue: 0 }
// }, {
//     tableName: 'notifications',
//     timestamps: true
// });

// module.exports = Notification;
