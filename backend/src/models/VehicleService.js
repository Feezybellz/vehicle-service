const mongoose = require("mongoose");

const vehicleServiceSchema = new mongoose.Schema(
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
    serviceDate: {
      type: Date,
      required: true,
    },
    nextServiceDate: {
      type: Date,
      required: true,
    },
    cronJobId: {
      type: String,
    },
    cost: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    serviceProvider: {
      type: String,
      trim: true,
    },
    documents: [
      {
        type: String, // URLs to stored documents
      },
    ],
  },
  {
    timestamps: true,
  }
);

const VehicleService = mongoose.model("VehicleService", vehicleServiceSchema);

module.exports = VehicleService;
