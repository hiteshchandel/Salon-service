// const Notification  = require("../models/notificationModel");

// // 📌 Get notifications for the logged-in user
// exports.getUserNotifications = async (req, res) => {
//     try {
//         const userId = req.user.id;

//         const notifications = await Notification.findAll({
//             where: { userId },
//             order: [["createdAt", "DESC"]],
//         });

//         return res.status(200).json({ notifications });
//     } catch (error) {
//         console.error("❌ Error fetching notifications:", error);
//         return res.status(500).json({
//             message: "Internal server error",
//             error: error.message,
//         });
//     }
// };
