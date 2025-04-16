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
          console.log("Sending email");

          const subject = `Service Reminder for ${userCron.vehicle.make} ${userCron.vehicle.model}`;

          console.log(subject);

          const message = `Hello , This is a reminder that your ${userCron.vehicle.make} ${userCron.vehicle.model} is due for a service on ${userCron?.vehicleService?.nextServiceDate ?? "Unknown Date"}.`;

          console.log(message);

          const result = await appMailer.sendMail({
            to: userCron.user.email,
            subject: subject,
            html: message,
          });

          console.log(result);

          //   userCron.status = "sent";
          //   userCron.active = false;
          //   await userCron.save();

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
