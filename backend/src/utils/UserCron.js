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
      .populate("vehicle");
    return userCrons;
  }

  async initialize() {
    const userCrons = await this.getAll();
    // console.log(userCrons);
    userCrons.forEach((userCron) => {
      const cronJob = nodeCron.schedule(userCron.cronExpression, async () => {
        console.log("Sending email to", userCron.user.email);
        await appMailer.sendMail({
          to: userCron.user.email,
          subject: `Service Reminder for ${userCron.vehicle.make} ${userCron.vehicle.model}`,
          html: `Service Reminder for ${userCron.vehicle.make} ${userCron.vehicle.model}`,
        });
      });
    });
  }

  async reload() {
    const userCrons = await this.getAll();
    userCrons.forEach((userCron) => {
      const cronJob = nodeCron.schedule(userCron.cronExpression, async () => {
        console.log("Sending email to", userCron.user.email);
        await appMailer.sendMail({
          to: userCron.user.email,
          subject: `Service Reminder for ${userCron.vehicle.make} ${userCron.vehicle.model}`,
          html: `Service Reminder for ${userCron.vehicle.make} ${userCron.vehicle.model}`,
        });
      });
    });
  }
}

module.exports = UserCronManager;
