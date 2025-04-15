const cron = require("node-cron");
const ServiceReminder = require("../models/ServiceReminder");
const User = require("../models/User");
const appMailer = require("./mailer");

class CronManager {
  constructor() {
    this.jobs = new Map();
  }

  async initialize() {
    // Schedule daily check for reminders
    this.scheduleDailyReminderCheck();
  }

  scheduleDailyReminderCheck() {
    // Run at 9 AM every day
    const job = cron.schedule("0 9 * * *", async () => {
      try {
        await this.checkUpcomingReminders();
      } catch (error) {
        console.error("Error in daily reminder check:", error);
      }
    });

    this.jobs.set("dailyReminderCheck", job);
  }

  async checkUpcomingReminders() {
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const upcomingReminders = await ServiceReminder.find({
      dueDate: {
        $gte: today,
        $lte: sevenDaysFromNow,
      },
      isCompleted: false,
    }).populate("vehicle");

    for (const reminder of upcomingReminders) {
      const user = await User.findById(reminder.vehicle.user);
      if (!user) continue;

      const daysUntilDue = Math.ceil(
        (reminder.dueDate - today) / (1000 * 60 * 60 * 24)
      );

      // Send email notification
      await appMailer.sendReminderEmail(
        user.email,
        reminder.vehicle.make,
        reminder.vehicle.model,
        reminder.serviceType,
        reminder.dueDate,
        daysUntilDue
      );
    }
  }

  stopAllJobs() {
    for (const [name, job] of this.jobs) {
      job.stop();
      this.jobs.delete(name);
    }
  }
}

module.exports = new CronManager();
