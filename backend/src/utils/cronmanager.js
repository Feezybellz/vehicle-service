const cron = require("node-cron");
const ServiceReminder = require("../models/ServiceReminder");
const User = require("../models/User");
// const appMailer = require("./mailer");

class CronManager {
  constructor() {
    this.jobs = new Map();
  }

  //   async initialize() {}

  generateCromCommandByDate(date) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  createJob(date, callback) {
    const jobId = `${date.getTime()}-${Math.random().toString(36).substr(2, 9)}`;
    const cronCommand = this.generateCromCommandByDate(date);
    const job = cron.schedule(cronCommand, callback);
    this.jobs.set(jobId, job);
    return jobId;
  }

  deleteJob(jobId) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.stop();
      this.jobs.delete(jobId);
    }
  }

  stopAllJobs() {
    for (const [name, job] of this.jobs) {
      job.stop();
      this.jobs.delete(name);
    }
  }
}

module.exports = CronManager;
