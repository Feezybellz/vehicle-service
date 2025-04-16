const express = require("express");
const router = express.Router();
const VehicleService = require("../models/VehicleService");
const auth = require("../middleware/auth");
const CronManager = require("../utils/cronManager");
const appMailer = require("../utils/appMailer");

const cronManager = new CronManager();
cronManager.initialize();

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

    const name = `Service Reminder for ${newService.vehicle.make} ${newService.vehicle.model}`;
    const description = `This job sends a notification ${newService.vehicle.make} ${newService.vehicle.model} service is due`;
    const cronExpression = cronManager.getCronExpressionFromDate(
      newService.nextServiceDate
    );
    const taskFn = () => {
      console.log("Service reminder sent");
    };
    const { jobId, doc } = await cronManager.createAndSaveJob(
      name,
      description,
      cronExpression,
      taskFn,
      { timezone: "UTC", metadata: { vehicleId: newService.vehicle._id } }
    );

    newService.cronJobId = jobId;
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

    if (req.body.vehicleId) service.vehicleId = req.body.vehicleId;
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

    // const cronExpression = cronManager.getCronExpressionFromDate(
    //   updatedService.nextServiceDate
    // );

    const cronExpression = "* * * * *";
    // const taskFn = () => {
    //   appMailer.sendMail({
    //     to: updatedService.user.email,
    //     subject: `Service Reminder for ${updatedService.vehicle.make} ${updatedService.vehicle.model}`,
    //     text: `This is a reminder that your ${updatedService.vehicle.make} ${updatedService.vehicle.model} service is due on ${updatedService.nextServiceDate}`,
    //   });
    // };

    const taskFn = function (context) {
      // These are now available through context
      const { appMailer, VehicleService, serviceId } = context;

      console.log("serviceId:", serviceId);

      return VehicleService.findById(serviceId)
        .populate("user vehicle")
        .then((service) => {
          if (!service || !service.user || !service.vehicle) {
            console.log("Service, user or vehicle not found");
          }

          console.log("Sending reminder email to:", service.user.email);
          return appMailer.sendMail({
            to: service.user.email,
            subject: `Service Reminder for ${service.vehicle.make} ${service.vehicle.model}`,
            text: `This is a reminder that your ${service.vehicle.make} ${service.vehicle.model} service is due on ${service.nextServiceDate}`,
            html: `<p>This is a reminder...</p>`,
          });
        })
        .catch((err) => {
          console.error("Reminder failed:", err);
          throw err;
        });
    };

    cronManager.updateJob(updatedService.cronJobId, cronExpression, {
      task: taskFn.toString(),
    });

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
    cronManager.deleteJob(service.cronJobId);
    await service.deleteOne();
    res.json({ status: "success", message: "Service deleted" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

module.exports = router;
