const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ServiceReminder = require("../models/ServiceReminder");

// Get all service reminders for the authenticated user
router.get("/", auth, async (req, res) => {
  try {
    const reminders = await ServiceReminder.find({
      user: req.user._id,
    }).populate("vehicle", "make model licensePlate");
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single service reminder
router.get("/:id", auth, async (req, res) => {
  try {
    const reminder = await ServiceReminder.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate("vehicle", "make model licensePlate");

    if (!reminder) {
      return res.status(404).json({ message: "Service reminder not found" });
    }

    res.json(reminder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new service reminder
router.post("/", auth, async (req, res) => {
  try {
    const reminder = new ServiceReminder({
      ...req.body,
      user: req.user._id,
    });

    await reminder.save();
    res.status(201).json(reminder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a service reminder
router.put("/:id", auth, async (req, res) => {
  try {
    const reminder = await ServiceReminder.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!reminder) {
      return res.status(404).json({ message: "Service reminder not found" });
    }

    res.json(reminder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark a service reminder as completed
router.patch("/:id/complete", auth, async (req, res) => {
  try {
    const reminder = await ServiceReminder.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      {
        isCompleted: true,
        completedDate: new Date(),
      },
      { new: true }
    );

    if (!reminder) {
      return res.status(404).json({ message: "Service reminder not found" });
    }

    res.json(reminder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a service reminder
router.delete("/:id", auth, async (req, res) => {
  try {
    const reminder = await ServiceReminder.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!reminder) {
      return res.status(404).json({ message: "Service reminder not found" });
    }

    res.json({ message: "Service reminder deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
