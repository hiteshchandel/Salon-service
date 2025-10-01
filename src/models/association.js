const sequelize = require('../config/database');

const User = require('./userModel');
const Service = require('./serviceModel');
const StaffService = require('./staffServiceModel');
const Availability = require('./availabilityModel');
const Appointment = require('./appointmentModel');
const Payment = require('./paymentModel');
const Review = require('./reviewModel');
const Notification = require('./notificationModel');

/* Associations */

// Customer (User) <-> Appointment (1:M)
User.hasMany(Appointment, { foreignKey: 'userId', onDelete: 'CASCADE', as: 'CustomerAppointments' });
Appointment.belongsTo(User, { foreignKey: 'userId', as: 'Customer' });

// Staff (User.role='staff') <-> Appointment (1:M)
User.hasMany(Appointment, { foreignKey: 'staffId', onDelete: 'SET NULL', as: 'StaffAssignedAppointments' });
Appointment.belongsTo(User, { foreignKey: 'staffId', as: 'Staff' });

// Service <-> Appointment (1:M)
Service.hasMany(Appointment, { foreignKey: 'serviceId', onDelete: 'RESTRICT' });
Appointment.belongsTo(Service, { foreignKey: 'serviceId' });

// Appointment <-> Payment (1:1)
Appointment.hasOne(Payment, { foreignKey: 'appointmentId', onDelete: 'CASCADE' });
Payment.belongsTo(Appointment, { foreignKey: 'appointmentId' });

// Staff Services (M:N) - User (staff) <-> Service through StaffService
User.belongsToMany(Service, { through: StaffService, foreignKey: 'userId', otherKey: 'serviceId' });
Service.belongsToMany(User, { through: StaffService, foreignKey: 'serviceId', otherKey: 'userId' });

// ✅ Direct associations for StaffService (fixes eager loading error)
StaffService.belongsTo(User, { foreignKey: 'userId' });
StaffService.belongsTo(Service, { foreignKey: 'serviceId' });

User.hasMany(StaffService, { foreignKey: 'userId' });
Service.hasMany(StaffService, { foreignKey: 'serviceId' });

// Staff Availability (User -> Availability 1:M)
User.hasMany(Availability, { foreignKey: 'userId', onDelete: 'CASCADE' });
Availability.belongsTo(User, { foreignKey: 'userId' });

// Reviews
User.hasMany(Review, { foreignKey: 'userId', onDelete: 'CASCADE' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'Reviewer' });

User.hasMany(Review, { foreignKey: 'staffId', onDelete: 'SET NULL', as: 'StaffReviews' });
Review.belongsTo(User, { foreignKey: 'staffId', as: 'Staff' });

Service.hasMany(Review, { foreignKey: 'serviceId', onDelete: 'SET NULL' });
Review.belongsTo(Service, { foreignKey: 'serviceId' });

// // Notifications (optional if you want notifications later)
// User.hasMany(Notification, { foreignKey: 'userId', onDelete: 'CASCADE' });
// Notification.belongsTo(User, { foreignKey: 'userId' });

// Appointment.hasMany(Notification, { foreignKey: 'appointmentId', onDelete: 'CASCADE' });
// Notification.belongsTo(Appointment, { foreignKey: 'appointmentId' });

// Appointment reschedule reference
Appointment.belongsTo(Appointment, { as: 'RescheduledFrom', foreignKey: 'rescheduledFromId' });

module.exports = {
    sequelize,
    User,
    Service,
    StaffService,
    Availability,
    Appointment,
    Payment,
    Review,
    Notification
};
