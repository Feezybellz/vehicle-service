const cron = require("node-cron");
const CronJob = require("../models/CronJob");

class CronManager {
  constructor() {
    this.jobs = new Map();

    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    if (!this.initializationPromise) {
      this.initializationPromise = (async () => {
        try {
          const jobs = await CronJob.find({ active: true });
          await Promise.all(jobs.map((job) => this.createJobFromDB(job)));
          this.initialized = true;
        } catch (err) {
          this.initializationPromise = null;
          throw err;
        }
      })();
    }

    return this.initializationPromise;
  }

  getCronExpressionFromDate(date) {
    if (!(date instanceof Date)) {
      throw new Error("Input must be a valid Date object");
    }

    const minutes = date.getMinutes();
    const hours = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1; // Months are 0-indexed in JS
    // const dayOfWeek = date.getDay(); // Not needed for one-time jobs

    // Cron format: minute hour day month *
    return `${minutes} ${hours} ${day} ${month} *`;
  }

  async createJobFromDB(jobDoc) {
    try {
      const jobId = jobDoc._id.toString();

      if (this.jobs.has(jobId)) {
        return jobId;
      }

      const job = cron.schedule(
        jobDoc.cronExpression,
        async () => {
          try {
            await jobDoc.execute();
          } catch (err) {}
        },
        {
          scheduled: jobDoc.active,
          timezone: jobDoc.timezone,
          recoverMissedExecutions: false,
        }
      );

      this.jobs.set(jobId, {
        instance: job,
        doc: jobDoc,
      });

      return jobId;
    } catch (err) {
      throw err;
    }
  }

  async createAndSaveJob(
    name,
    description,
    cronExpression,
    taskFn,
    options = {}
  ) {
    try {
      // Validate inputs
      if (!name || !cronExpression || !taskFn) {
        throw new Error("Name, cronExpression and taskFn are required");
      }

      if (typeof taskFn !== "function") {
        throw new Error("taskFn must be a function");
      }

      // Convert function to string for storage
      const taskString = `(${taskFn.toString()})`;

      const cronJob = new CronJob({
        name,
        description,
        cronExpression,
        task: taskString,
        timezone: options.timezone || "UTC",
        metadata: options.metadata,
        active: options.active !== false,
      });

      const savedJob = await cronJob.save(
        options.session ? { session: options.session } : undefined
      );
      const jobId = await this.createJobFromDB(savedJob);

      return { jobId, doc: savedJob };
    } catch (err) {
      throw err;
    }
  }

  async updateJob(jobId, cronExpression, options = {}) {
    console.log(jobId);
    console.log(this.jobs);
    try {
      if (!this.jobs.has(jobId)) {
        await this.createAndSaveJob(jobId, cronExpression, options);

        return;
        // throw new Error(`Job ${jobId} not found`);
      }

      const job = this.jobs.get(jobId);
      console.log(job);

      job.instance.stop();

      // Update the database record
      const updatedJob = await CronJob.findByIdAndUpdate(jobId, {
        cronExpression,
        ...(options.session ? { session: options.session } : {}),
        ...(options.task ? { task: options.task } : {}),
      });

      job.instance.start();

      this.jobs.set(jobId, {
        instance: job,
        doc: updatedJob,
      });

      return updatedJob;
    } catch (err) {
      throw err;
    }
  }

  async deleteJob(jobId, options = {}) {
    try {
      if (!this.jobs.has(jobId)) {
        const exists = await CronJob.exists({ _id: jobId });
        if (!exists) {
          // throw new Error(`Job ${jobId} not found in database`);
        }
        await CronJob.findByIdAndDelete(
          jobId,
          options.session ? { session: options.session } : undefined
        );
        return true;
      }

      const job = this.jobs.get(jobId);
      job.instance.stop();
      this.jobs.delete(jobId);

      await CronJob.findByIdAndDelete(
        jobId,
        options.session ? { session: options.session } : undefined
      );

      return true;
    } catch (err) {
      throw err;
    }
  }

  async toggleJob(jobId, active, options = {}) {
    try {
      const job = this.jobs.get(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      if (active) {
        job.instance.start();
      } else {
        job.instance.stop();
      }

      const updatedJob = await CronJob.findByIdAndUpdate(
        jobId,
        { active },
        { new: true, ...(options.session ? { session: options.session } : {}) }
      );

      return updatedJob;
    } catch (err) {
      throw err;
    }
  }

  getJob(jobId) {
    return this.jobs.get(jobId);
  }

  listJobs() {
    return Array.from(this.jobs.entries()).map(([id, job]) => ({
      id,
      name: job.doc.name,
      description: job.doc.description,
      cronExpression: job.doc.cronExpression,
      active: job.doc.active,
      lastExecution: job.doc.lastExecution,
      nextExecution: job.doc.nextExecution,
      timezone: job.doc.timezone,
      metadata: job.doc.metadata,
    }));
  }

  stopAllJobs() {
    this.jobs.forEach((job) => job.instance.stop());
    this.jobs.clear();
  }
}

module.exports = CronManager;
