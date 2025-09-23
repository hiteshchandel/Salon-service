// models/reviewModel.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },    // customer
    staffId: { type: DataTypes.INTEGER, allowNull: true },    // optional
    serviceId: { type: DataTypes.INTEGER, allowNull: true },  // optional
    appointmentId: { type: DataTypes.INTEGER, allowNull: true },

    rating: { type: DataTypes.INTEGER, allowNull: false }, // 1-5
    comment: { type: DataTypes.TEXT, allowNull: true },
    staffResponse: { type: DataTypes.TEXT, allowNull: true }, // staff reply

    reviewType: { type: DataTypes.ENUM('service', 'staff', 'appointment'), defaultValue: 'service' },
    isPublished: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
    tableName: 'reviews',
    timestamps: true
});

module.exports = Review;
