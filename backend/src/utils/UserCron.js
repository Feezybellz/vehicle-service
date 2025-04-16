const UserCron = require("../models/UserCron");
const nodeCron = require("node-cron");
const appMailer = require("./appMailer");

class UserCronManager {
  constructor() {
    this.userCrons = [];
  }

  async create(userCron) {
    const newUserCron = new UserCron(userCron);
    const savedUserCron = await newUserCron.save();
    return savedUserCron;
  }

  async update(userCronId, userCron) {
    const updatedUserCron = await UserCron.findByIdAndUpdate(
      userCronId,
      userCron,
      { new: true }
    );
    return updatedUserCron;
  }

  async delete(userCronId) {
    const deletedUserCron = await UserCron.findByIdAndDelete(userCronId);
    return deletedUserCron;
  }

  async get(userCronId) {
    const userCron = await UserCron.findById(userCronId);
    return userCron;
  }

  async getAll() {
    const userCrons = await UserCron.find()
      .populate("user")
      .populate("vehicle")
      .populate("vehicleService");
    return userCrons;
  }

  async getActiveCrons() {
    const userCrons = await UserCron.find({ active: true })
      .populate("user")
      .populate("vehicle")
      .populate("vehicleService");
    return userCrons;
  }

  async load() {
    const userCrons = await this.getActiveCrons();
    userCrons.forEach((userCron) => {
      try {
        const cronJob = nodeCron.schedule(userCron.cronExpression, async () => {
          //   console.log("Sending email to", userCron.user.email);
          const subject = `Service Reminder for ${userCron.vehicle.make} ${userCron.vehicle.model}`;

          //   console.log(subject);

          const message = `Hello ${userCron.user.firstName} ${userCron.user.lastName}, This is a reminder that your ${userCron.vehicle.make} ${userCron.vehicle.model} - [${userCron.vehicle.licensePlate}] is due for ${userCron?.vehicleService?.serviceType ?? "a"} service on ${userCron?.vehicleService?.nextServiceDate ?? "Unknown Date"}.`;

          //   console.log(message);

          const result = await appMailer.sendMail({
            to: userCron.user.email,
            subject: subject,
            html: message,
          });

          console.log(result);

          await UserCron.findByIdAndUpdate(
            userCron._id,
            {
              status: "sent",
              active: false,
              updatedAt: new Date(),
            },
            { new: true }
          );

          console.log("Email sent");

          cronJob.stop();
        });
      } catch (error) {
        console.log(error);
      }
    });
  }

  getCronExpressionFromDate(date) {
    if (!(date instanceof Date)) {
      throw new Error("Input must be a valid Date object");
    }

    const minutes = date.getMinutes();
    const hours = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${minutes} ${hours} ${day} ${month} *`;
  }
}

module.exports = UserCronManager;
