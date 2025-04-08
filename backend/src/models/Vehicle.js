const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    make: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
    },
    licensePlate: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    vin: {
      type: String,
      trim: true,
    },
    lastServiceDate: {
      type: Date,
    },
    nextServiceDate: {
      type: Date,
    },
    serviceInterval: {
      type: Number, // in months
      default: 6,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

module.exports = Vehicle;
