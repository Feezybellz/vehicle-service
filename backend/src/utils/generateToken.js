const jwt = require("jsonwebtoken");
// const dotenv = require("dotenv");

// dotenv.config();

// Function to generate JWT tokens
const generateToken = (payload, secret) => {
  let exp = process.env.JWT_EXPIRES_IN;

  if (["string", "number"].includes(typeof payload.exp)) {
    if (payload.exp) {
      exp = payload.exp;
    }
  }

  const token = jwt.sign(payload, secret, {
    expiresIn: exp,
  });

  return token;
};

const generateUserToken = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  return generateToken(payload, process.env.JWT_SECRET);
};

const generateUserRefreshToken = (user_id) => {
  const payload = {
    id: user_id,
  };

  return generateToken(payload, process.env.JWT_REFRESH_SECRET);
};

module.exports = { generateToken, generateUserToken, generateUserRefreshToken };
