const express = require("express");
const router = express.Router();
const VehicleService = require("../models/VehicleService");
const auth = require("../middleware/auth");
const UserCronManager = require("../utils/UserCron");

const userCronManager = new UserCronManager();
userCronManager.load();

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
                licensePlate: doc.licensePlate,
              }
            : null,
      })
      .lean(); // Convert to plain JavaScript objects

    res.json({ status: "success", data: services });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.get("/upcoming", auth, async (req, res) => {
  try {
    const currentDate = new Date();

    const services = await VehicleService.find({
      user: req.user._id,
      nextServiceDate: {
        $gte: currentDate,
        $lte: new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
      },
    })
      .populate("user", "firstName lastName email")
      .populate("vehicle", "make model licensePlate")
      .lean()
      .exec();

    // Transform the data for cleaner response
    const transformedServices = services.map((service) => ({
      ...service,
      vehicle: service.vehicle
        ? {
            make: service.vehicle.make,
            model: service.vehicle.model,
            id: service.vehicle._id,
            licensePlate: service.vehicle.licensePlate,
          }
        : null,
      user: service.user
        ? {
            firstName: service.user.firstName,
            lastName: service.user.lastName,
            email: service.user.email,
            id: service.user._id,
          }
        : null,
    }));

    res.json({
      status: "success",
      data: transformedServices,
      meta: {
        count: transformedServices.length,
        dateRange: {
          from: currentDate,
          to: new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    });
  } catch (err) {
    console.error("Error fetching upcoming services:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch upcoming services",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

// Get one vehicle service
router.get("/:id", auth, async (req, res) => {
  try {
    const service = await VehicleService.findById(req.params.id)
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
                licensePlate: doc.licensePlate,
              }
            : null,
      })
      .lean(); // Convert to plain JavaScript objects

    if (!service) {
      return res
        .status(404)
        .json({ status: "error", message: "Service not found" });
    }
    res.json({ status: "success", data: service });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// get all vehicle services by vehicle id
router.get("/vehicle/:id", auth, async (req, res) => {
  try {
    const services = await VehicleService.find({ vehicle: req.params.id })
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
                licensePlate: doc.licensePlate,
              }
            : null,
      })
      .lean(); // Convert to plain JavaScript objects

    res.json({ status: "success", data: services });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
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
    const serviceData = await VehicleService.findById(newService._id).populate(
      "vehicle"
    );

    const userCron = await userCronManager.create({
      user: req.user._id,
      vehicle: req.body.vehicleId,
      vehicleService: newService._id,
      cronExpression: userCronManager.getCronExpressionFromDate(
        newService.nextServiceDate
      ),
    });

    newService.cronJobId = userCron._id;

    userCronManager.load();

    await newService.save();

    res.status(201).json({
      status: "success",
      message: "Service created successfully",
    });
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message });
  }
});

// Update vehicle service
router.patch("/:id", auth, async (req, res) => {
  try {
    const service = await VehicleService.findById(req.params.id);
    if (!service) {
      return res
        .status(404)
        .json({ status: "error", message: "Service not found" });
    }

    const errors = [];
    if (req.body.vehicleId.length < 1) {
      errors.push("Vehicle is required");
    }

    if (errors.length > 0) {
      return res.status(400).json({
        status: "error",
        errors: errors,
        message: "Some error occured",
      });
    }

    if (req.body.vehicleId) service.vehicle = req.body.vehicleId;

    if (req.body.serviceType) service.serviceType = req.body.serviceType;
    if (req.body.serviceDate) service.serviceDate = req.body.serviceDate;
    if (req.body.nextServiceDate)
      service.nextServiceDate = req.body.nextServiceDate;
    if (req.body.cost) service.cost = req.body.cost;
    if (req.body.notes) service.notes = req.body.notes;
    if (req.body.serviceProvider)
      service.serviceProvider = req.body.serviceProvider;

    // First save the document
    const savedService = await service.save();

    // Then find and populate in a separate query
    const updatedService = await VehicleService.findById(
      savedService._id
    ).populate([
      {
        path: "user",
        select: "firstName lastName email",
        transform: (doc) =>
          doc
            ? {
                firstName: doc.firstName,
                lastName: doc.lastName,
                email: doc.email,
              }
            : null,
      },
      {
        path: "vehicle",
        select: "make model year licensePlate",
        transform: (doc) =>
          doc
            ? {
                make: doc.make,
                model: doc.model,
                year: doc.year,
                licensePlate: doc.licensePlate,
              }
            : null,
      },
    ]);

    // const cronExpression = "*/1 * * * *";
    const cronExpression = userCronManager.getCronExpressionFromDate(
      updatedService.nextServiceDate
    );

    const userCron = await userCronManager.update(updatedService.cronJobId, {
      cronExpression,
      active: true,
      status: "pending",
    });

    userCronManager.load();

    res.json({
      status: "success",
      // data: updatedService,
      message: "Service updated successfully",
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message,
      err_file: err.stack,
    });
  }
});

// Delete vehicle service
router.delete("/:id", auth, async (req, res) => {
  try {
    const service = await VehicleService.findById(req.params.id);
    if (!service) {
      return res
        .status(404)
        .json({ status: "error", message: "Service not found" });
    }

    await userCronManager.delete(service.cronJobId);

    userCronManager.load();

    await service.deleteOne();
    res.json({ status: "success", message: "Service deleted" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

module.exports = router;
