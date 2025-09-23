const Razorpay = require("razorpay");
const crypto = require("crypto");
const Appointment = require('../models/appointmentModel');
const Service = require('../models/serviceModel');

// 🔹 Setup Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// 📌 Create Razorpay Order
exports.createOrder = async (req, res) => {
    try {
        const { serviceId, staffId, appointmentDate, startTime, endTime } = req.body;

        // Validate service
        const service = await Service.findByPk(serviceId);
        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        // Create Razorpay order
        const options = {
            amount: service.price * 100, // convert to paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        // Create appointment in DB with pending payment
        const appointment = await Appointment.create({
            userId: req.user.id,
            staffId,
            serviceId,
            appointmentDate,
            startTime,
            endTime,
            status: "pending",
            paymentStatus: "pending",
            razorpayOrderId: order.id
        });

        return res.status(201).json({
            message: "Order created successfully",
            order,
            appointment
        });
    } catch (error) {
        console.error("❌ Error creating order:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

// 📌 Verify Payment Signature
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointmentId } = req.body;

        // Generate expected signature
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ message: "Payment verification failed" });
        }

        // Update appointment status
        const appointment = await Appointment.findByPk(appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        appointment.paymentStatus = "paid";
        appointment.status = "confirmed";
        appointment.razorpayPaymentId = razorpay_payment_id;
        await appointment.save();

        return res.status(200).json({
            message: "Payment verified successfully",
            appointment
        });
    } catch (error) {
        console.error("❌ Error verifying payment:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
