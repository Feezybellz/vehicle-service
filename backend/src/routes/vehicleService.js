const express = require("express");
const router = express.Router();
const VehicleService = require("../models/vehicleService");
const auth = require("../middleware/auth");
const CronManager = require("../utils/cronManager");

// Get all vehicle services
router.get("/", auth, async (req, res) => {
  try {
    const services = await VehicleService.find({ user: req.user._id })
      .populate({
        path: "user",
        select: "firstName lastName email",
        transform: (doc) =>
          doc
            ? {
                firstName: doc.firstName,
                lastName: doc.lastName,
              }
            : null,
      })
      .populate({
        path: "vehicle",
        select: "make model licensePlate _id",
        transform: (doc) =>
          doc
            ? {
                make: doc.make,
                model: doc.model,
                id: doc._id,
              }
            : null,
      })
      .lean(); // Convert to plain JavaScript objects

    res.json({ status: "success", data: services });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one vehicle service
router.get("/:id", auth, async (req, res) => {
  try {
    const service = await VehicleService.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create vehicle service
router.post("/", auth, async (req, res) => {
  const service = new VehicleService({
    // vehicleId: req.body.vehicleId,
    serviceType: req.body.serviceType,
    serviceDate: req.body.serviceDate,
    nextServiceDate: req.body.nextServiceDate,
    cost: req.body.cost,
    notes: req.body.notes,
    user: req.user._id,
    cronJobId: null,
    isCompleted: false,
    completedDate: null,
    notificationSent: false,
    vehicle: req.body.vehicleId,
  });

  try {
    const newService = await service.save();
    const cronManager = new CronManager();

    const cronJobId = cronManager.createJob(newService.nextServiceDate, () => {
      console.log("Service reminder sent");
    });
    newService.cronJobId = cronJobId;
    await newService.save();

    res.status(201).json(newService);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update vehicle service
router.patch("/:id", auth, async (req, res) => {
  try {
    const service = await VehicleService.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    if (req.body.vehicleId) service.vehicleId = req.body.vehicleId;
    if (req.body.serviceType) service.serviceType = req.body.serviceType;
    if (req.body.serviceDate) service.serviceDate = req.body.serviceDate;
    if (req.body.nextServiceDate)
      service.nextServiceDate = req.body.nextServiceDate;
    if (req.body.cost) service.cost = req.body.cost;
    if (req.body.notes) service.notes = req.body.notes;

    const updatedService = await service.save();
    const cronManager = new CronManager();
    cronManager.deleteJob(updatedService.cronJobId);
    const cronJobId = cronManager.createJob(
      updatedService.nextServiceDate,
      () => {
        console.log("Service reminder sent");
      }
    );
    updatedService.cronJobId = cronJobId;
    await updatedService.save();

    res.json(updatedService);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete vehicle service
router.delete("/:id", auth, async (req, res) => {
  try {
    const service = await VehicleService.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    await service.remove();
    res.json({ message: "Service deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
