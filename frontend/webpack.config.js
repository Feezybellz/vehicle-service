const Dotenv = require("dotenv-webpack");

module.exports = {
  plugins: [
    new Dotenv({
      systemvars: true, // Load system environment variables too
      prefix: "", // Remove any prefix requirement
    }),
  ],
};
