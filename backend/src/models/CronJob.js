const mongoose = require("mongoose");
const cronParser = require("cron-parser");

const cronJobSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    cronExpression: {
      type: String,
      required: true,
    },
    task: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          try {
            new Function("return " + v);
            return true;
          } catch (e) {
            return false;
          }
        },
        message: "Invalid function definition",
      },
    },
    active: {
      type: Boolean,
      default: true,
    },
    timezone: {
      type: String,
      default: "UTC",
      validate: {
        validator: function (v) {
          try {
            Intl.DateTimeFormat(undefined, { timeZone: v });
            return true;
          } catch (e) {
            return false;
          }
        },
        message: (props) => `${props.value} is not a valid timezone`,
      },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Pre-save hook to validate and calculate next execution
// cronJobSchema.pre("save", async function (next) {
//   if (this.isModified("cronExpression") || this.isNew) {
//     try {
//       const interval = cronParser.parseExpression(this.cronExpression, {
//         tz: this.timezone,
//       });
//       this.nextExecution = interval.next().toDate();
//     } catch (err) {
//       return next(err);
//     }
//   }
//   next();
// });

// Static method to get next execution time
// cronJobSchema.statics.getNextExecution = function (
//   cronExpression,
//   timezone = "UTC"
// ) {
//   try {
//     const interval = cronParser.parseExpression(cronExpression, {
//       tz: timezone,
//     });
//     return interval.next().toDate();
//   } catch (err) {
//     throw new Error(`Invalid cron expression: ${err.message}`);
//   }
// };

// Method to execute the task
cronJobSchema.methods.execute = async function () {
  try {
    const taskFn = new Function("return " + this.task)();
    await taskFn();
    await this.save();
    return { success: true };
  } catch (err) {
    console.error(`Error executing cron job ${this.name}:`, err);
    throw err;
  }
};

const CronJob = mongoose.model("CronJob", cronJobSchema);

module.exports = CronJob;
