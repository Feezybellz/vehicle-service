const mongoose = require("mongoose");

const userCronSchema = new mongoose.Schema({
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
  vehicleService: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VehicleService",
    required: true,
  },
  cronExpression: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  cronJobId: {
    type: String,
  },
});

module.exports = mongoose.model("UserCron", userCronSchema);
