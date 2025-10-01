const Appointment = require('../models/appointmentModel');
const Payment = require('../models/paymentModel');
const Service = require('../models/serviceModel');
const User = require('../models/userModel');
const Razorpay = require("razorpay");
const crypto = require("crypto");

// 🔹 Setup Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * 📌 Create Razorpay order + draft appointment
 */
exports.createOrder = async (req, res) => {
    try {
        const { userId, staffId, serviceId, date, startTime, endTime } = req.body;

        // Validate service
        const service = await Service.findByPk(serviceId);
        if (!service) return res.status(404).json({ message: "Service not found" });

        // Validate staff
        const staff = await User.findOne({ where: { id: staffId, role: "staff" } });
        if (!staff) return res.status(404).json({ message: "Staff not found" });

        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount: service.price * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        });

        // Create appointment (and capture variable)
        const appointment = await Appointment.create({
            userId: req.user.id,  // take logged-in user
            staffId,
            serviceId,
            date,
            startTime,
            endTime,
            status: "pending",
            paymentStatus: "pending",
            source: "web"
        });

        // Create payment record
        const payment = await Payment.create({
            appointmentId: appointment.id,
            amount: service.price,
            razorpayOrderId: order.id,
            status: "created"
        });

        return res.status(201).json({
            message: "Order created successfully",
            order,
            appointment,
            paymentId: payment.id
        });
    } catch (err) {
        console.error("❌ Error creating order:", err);
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
};


/**
 * 📌 Verify Razorpay payment + update both Payment & Appointment
 */
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointmentId, paymentId } = req.body;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: "Payment verification failed" });
        }

        const payment = await Payment.findByPk(paymentId);
        const appointment = await Appointment.findByPk(appointmentId);

        if (!payment || !appointment) {
            return res.status(404).json({ message: "Invalid payment or appointment" });
        }

        // Update payment
        payment.razorpayPaymentId = razorpay_payment_id;
        payment.razorpaySignature = razorpay_signature;
        payment.status = "captured";
        payment.paidAt = new Date();
        await payment.save();

        // Update appointment only if it was unpaid
        if (appointment.paymentStatus !== "paid") {
            appointment.paymentStatus = "paid";
            appointment.status = "confirmed";
            await appointment.save();
        }

        return res.status(200).json({
            message: "Payment verified and appointment confirmed",
            appointment,
            payment
        });
    } catch (err) {
        console.error("❌ Error verifying payment:", err);
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
};

/**
 * 📌 Get Appointments
 */
exports.getAppointments = async (req, res) => {
    try {
        const where = req.user.role === "admin" ? {} : { userId: req.user.id };

        const appointments = await Appointment.findAll({
            where,
            include: [
                { model: Service, attributes: ["id", "name", "price", "duration"] },
                { model: User, as: "Staff", attributes: ["id", "name", "email"] },
                { model: Payment, attributes: ["id", "amount", "status", "razorpayOrderId", "razorpayPaymentId"] }
            ],
            order: [["date", "DESC"], ["startTime", "DESC"]]
        });

        return res.status(200).json({ appointments });
    } catch (err) {
        console.error("❌ Error fetching appointments:", err);
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
};

/**
 * 📌 Update / Reschedule Appointment
 */
exports.updateAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, startTime, endTime } = req.body;

        const appointment = await Appointment.findByPk(id);
        if (!appointment) return res.status(404).json({ message: "Appointment not found" });
        if (appointment.userId !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        appointment.date = date || appointment.date;
        appointment.startTime = startTime || appointment.startTime;
        appointment.endTime = endTime || appointment.endTime;

        // Keep confirmed if already paid
        if (appointment.paymentStatus !== "paid") {
            appointment.status = "pending";
        }

        await appointment.save();

        return res.status(200).json({ message: "Appointment updated", appointment });
    } catch (err) {
        console.error("❌ Error updating appointment:", err);
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
};

/**
 * 📌 Cancel Appointment
 */
exports.cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const appointment = await Appointment.findByPk(id);
        if (!appointment) return res.status(404).json({ message: "Appointment not found" });

        if (appointment.userId !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        appointment.status = "cancelled";
        await appointment.save();

        return res.status(200).json({ message: "Appointment cancelled", appointment });
    } catch (err) {
        console.error("❌ Error cancelling appointment:", err);
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
};
