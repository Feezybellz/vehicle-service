const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Vehicle = require("../models/Vehicle");

// Get all vehicles for the authenticated user
router.get("/", auth, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ user: req.user._id });
    res.json({ status: "success", data: vehicles });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Get a single vehicle
router.get("/:id", auth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!vehicle) {
      return res
        .status(404)
        .json({ status: "error", message: "Vehicle not found" });
    }

    res.json({ status: "success", data: vehicle });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Create a new vehicle
router.post("/", auth, async (req, res) => {
  try {
    const vehicle = new Vehicle({
      ...req.body,
      user: req.user._id,
    });

    await vehicle.save();
    res.status(201).json({ status: "success", data: vehicle });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
});

// Update a vehicle
router.put("/:id", auth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return res
        .status(404)
        .json({ status: "error", message: "Vehicle not found" });
    }

    res.json({ status: "success", data: vehicle });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
});

// Delete a vehicle
router.delete("/:id", auth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!vehicle) {
      return res
        .status(404)
        .json({ status: "error", message: "Vehicle not found" });
    }

    res.json({ status: "success", message: "Vehicle deleted successfully" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;
