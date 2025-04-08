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
    serviceType: {
      type: String,
      required: true,
      trim: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    mileage: {
      type: Number,
    },
    notes: {
      type: String,
      trim: true,
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
