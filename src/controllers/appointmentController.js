const Appointment = require('../models/appointmentModel');
const Payment = require('../models/paymentModel');
const Service = require('../models/serviceModel');
const User = require('../models/userModel');
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { Op } = require('sequelize');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order + draft appointment
exports.createOrder = async (req, res) => {
    try {
        const { staffId, serviceId, date, startTime, source } = req.body;

        const service = await Service.findByPk(serviceId);
        if (!service) return res.status(404).json({ message: "Service not found" });

        const staff = await User.findOne({ where: { id: staffId, role: "staff" } });
        if (!staff) return res.status(404).json({ message: "Staff not found" });

        let [h, m] = startTime.split(":").map(Number);
        let endHour = h + Math.floor((m + service.duration) / 60);
        let endMin = (m + service.duration) % 60;
        const endTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}:00`;

        const order = await razorpay.orders.create({
            amount: service.price * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        });

        const appointment = await Appointment.create({
            userId: req.user.id,
            staffId,
            serviceId,
            date,
            startTime,
            endTime,
            status: "pending",
            paymentStatus: "pending",
            source: source || "web"
        });

        const payment = await Payment.create({
            appointmentId: appointment.id,
            amount: service.price,
            razorpayOrderId: order.id,
            status: "created"
        });

        return res.status(201).json({ message: "Order created successfully", order, appointment, paymentId: payment.id });
    } catch (err) {
        console.error("❌ Error creating order:", err);
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
};

// Verify Razorpay payment + update Appointment & Payment
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointmentId, paymentId } = req.body;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (expectedSignature !== razorpay_signature)
            return res.status(400).json({ message: "Payment verification failed" });

        const payment = await Payment.findByPk(paymentId);
        const appointment = await Appointment.findByPk(appointmentId);

        if (!payment || !appointment) return res.status(404).json({ message: "Invalid payment or appointment" });
        if (payment.status === "captured") return res.status(400).json({ message: "Payment already verified" });

        payment.razorpayPaymentId = razorpay_payment_id;
        payment.razorpaySignature = razorpay_signature;
        payment.status = "captured";
        payment.paidAt = new Date();
        await payment.save();

        appointment.paymentStatus = "paid";
        appointment.status = "confirmed";
        await appointment.save();

        return res.status(200).json({ message: "Payment verified and appointment confirmed", appointment, payment });
    } catch (err) {
        console.error("❌ Error verifying payment:", err);
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
};

// Get Appointments
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

// Update / Reschedule Appointment
exports.updateAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, startTime } = req.body;

        const appointment = await Appointment.findByPk(id);
        if (!appointment) return res.status(404).json({ message: "Appointment not found" });
        if (appointment.userId !== req.user.id && req.user.role !== "admin")
            return res.status(403).json({ message: "Unauthorized" });

        const service = await Service.findByPk(appointment.serviceId);
        if (!service) return res.status(404).json({ message: "Service not found" });

        const newStartTime = startTime || appointment.startTime;
        const [h, m] = newStartTime.split(":").map(Number);
        const endHour = h + Math.floor((m + service.duration) / 60);
        const endMin = (m + service.duration) % 60;
        const newEndTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}:00`;

        // Optional: check overlapping appointments here

        appointment.date = date || appointment.date;
        appointment.startTime = newStartTime;
        appointment.endTime = newEndTime;
        if (appointment.paymentStatus !== "paid") appointment.status = "pending";

        await appointment.save();
        return res.status(200).json({ message: "Appointment updated", appointment });
    } catch (err) {
        console.error("❌ Error updating appointment:", err);
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
};

// Cancel Appointment
exports.cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const appointment = await Appointment.findByPk(id);
        if (!appointment) return res.status(404).json({ message: "Appointment not found" });

        if (appointment.userId !== req.user.id && req.user.role !== "admin")
            return res.status(403).json({ message: "Unauthorized" });

        appointment.status = "cancelled";
        await appointment.save();

        return res.status(200).json({ message: "Appointment cancelled", appointment });
    } catch (err) {
        console.error("❌ Error cancelling appointment:", err);
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
};

// Get single appointment by ID
exports.getAppointmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await Appointment.findByPk(id, {
            include: [
                { model: Service, attributes: ["id", "name", "price", "duration"] },
                { model: User, as: "Staff", attributes: ["id", "name", "email"] },
                { model: Payment, attributes: ["id", "amount", "status", "razorpayOrderId", "razorpayPaymentId"] }
            ]
        });

        if (!appointment) return res.status(404).json({ message: "Appointment not found" });

        // If user is not admin, ensure they own the appointment
        if (req.user.role !== "admin" && appointment.userId !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        return res.status(200).json({ appointment });
    } catch (err) {
        console.error("❌ Error fetching appointment by ID:", err);
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
};

/// Get all appointments for a specific staff, ordered by nearest upcoming datetime
exports.getStaffAppointments = async (req, res) => {
    try {
        if (req.user.role !== "staff") {
            return res.status(403).json({ message: "Access denied. Only staff can view their appointments." });
        }

        const appointments = await Appointment.findAll({
            where: { staffId: req.user.id },
            include: [
                { model: Service, attributes: ["id", "name", "price", "duration"] },
                { model: User, as: "Customer", attributes: ["id", "name", "email"] },
                { model: Payment, attributes: ["id", "amount", "status", "razorpayOrderId", "razorpayPaymentId"] }
            ]
        });

        // Sort by nearest upcoming datetime
        const now = new Date();
        const sortedAppointments = appointments
            .map(app => ({
                ...app.toJSON(),
                appointmentDateTime: new Date(`${app.date}T${app.startTime}`)
            }))
            .sort((a, b) => Math.abs(a.appointmentDateTime - now) - Math.abs(b.appointmentDateTime - now));

        return res.status(200).json({ appointments: sortedAppointments });
    } catch (err) {
        console.error("❌ Error fetching staff appointments:", err);
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
};



