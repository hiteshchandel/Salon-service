// models/paymentModel.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    appointmentId: { type: DataTypes.INTEGER, allowNull: false },

    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    currency: { type: DataTypes.STRING(8), defaultValue: 'INR' },

    // Razorpay-specific fields (online-only)
    razorpayOrderId: { type: DataTypes.STRING, allowNull: false },   // order created server-side
    razorpayPaymentId: { type: DataTypes.STRING, allowNull: true },  // filled after client succeeds
    razorpaySignature: { type: DataTypes.STRING, allowNull: true },  // verification
    status: { type: DataTypes.ENUM('created', 'captured', 'failed', 'refunded'), defaultValue: 'created' },
    paidAt: { type: DataTypes.DATE, allowNull: true },

    meta: { type: DataTypes.JSON, allowNull: true } // raw provider response if needed
}, {
    tableName: 'payments',
    timestamps: true
});

module.exports = Payment;
