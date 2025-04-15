const mongoose = require("mongoose");

const serviceReminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VehicleService",
      required: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedDate: {
      type: Date,
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const ServiceReminder = mongoose.model(
  "ServiceReminder",
  serviceReminderSchema
);

module.exports = ServiceReminder;
