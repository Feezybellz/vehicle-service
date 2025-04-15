const express = require("express");
const router = express.Router();
const VehicleService = require("../models/vehicleService");

// Get all vehicle services
router.get("/", async (req, res) => {
  try {
    const services = await VehicleService.find();
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one vehicle service
router.get("/:id", async (req, res) => {
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
router.post("/", async (req, res) => {
  const service = new VehicleService({
    vehicleId: req.body.vehicleId,
    serviceType: req.body.serviceType,
    serviceDate: req.body.serviceDate,
    nextServiceDate: req.body.nextServiceDate,
    cost: req.body.cost,
    notes: req.body.notes,
  });

  try {
    const newService = await service.save();
    res.status(201).json(newService);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update vehicle service
router.patch("/:id", async (req, res) => {
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
    res.json(updatedService);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete vehicle service
router.delete("/:id", async (req, res) => {
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
