const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");

const crypto = require("crypto");
const nodemailer = require("nodemailer");
const appMailer = require("../utils/appMailer");
const inputValidator = require("../utils/inputValidator");
const {
  generateToken,
  generateUserToken,
  generateUserRefreshToken,
} = require("../utils/generateToken");

// Signup route
router.post("/signup", async (req, res) => {
  try {
    const {
      email = "",
      password = "",
      firstName = "",
      lastName = "",
    } = req.body;

    // Validate input
    const validationResult = new inputValidator();
    validationResult
      .withMessage("Email is required", "email")
      .isEmail(email, "email")

      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
        "password"
      )
      .isPassword(password, "password")

      .withMessage(
        "Password length must be greater than 8 characters",
        "password"
      )
      .minLength(password, 8, "password")

      .withMessage("First name is required", "firstName")
      .withMessage("First name is required", "firstName")
      .notEmpty(firstName, "firstName")
      .withMessage("Last name is required", "lastName")
      .notEmpty(lastName, "lastName");

    if (!validationResult.isValid()) {
      return res.status(400).json({
        status: "error",
        message: "Some fields are invalid",
        errors: validationResult.getErrors(),
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ status: "error", message: "Email already registered" });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      verificationToken,
    });

    await user.save();

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    await appMailer.sendVerificationEmail(email, verificationUrl);

    res.status(201).json({
      status: "success",
      message:
        "User created successfully. Please check your email for verification.",
    });
  } catch (error) {
    let message = error.message;
    if (process.env.APP_ENV === "production") {
      message = "Something went wrong";
    }

    res.status(400).json({ status: "error", message });
  }
});

// Verify email route
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid verification token" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ status: "success", message: "Email verified successfully" });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
});

// Login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res
        .status(401)
        .json({ status: "error", message: "Please verify your email first" });
    }

    const userToken = generateUserToken(user);
    const userRefreshToken = generateUserRefreshToken(user._id);

    await RefreshToken.create({
      userId: user._id,
      token: userRefreshToken,
    });

    res.json({
      accessToken: userToken,
      refreshToken: userRefreshToken,
      status: "success",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
});

// Forgot password route
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ status: "error", message: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await appMailer.sendResetPasswordEmail(email, resetUrl);

    res.json({ status: "success", message: "Password reset email sent" });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
});

// Reset password route
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({ resetPasswordToken: token });

    if (!user) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid reset token" });
    }

    user.password = newPassword;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ status: "success", message: "Password reset successfully" });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
});

// Logout route
router.post("/logout", async (req, res) => {
  try {
    res.clearCookie("token");
    res.json({ status: "success", message: "Logged out successfully" });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
});

// Refresh token route
router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.headers.authorization.split(" ")[1] ?? null;

    if (!refreshToken) {
      return res
        .status(401)
        .json({ status: "error", message: "Refresh token is required" });
    }

    console.log(process.env.JWT_REFRESH_SECRET);
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const refreshTokenFromDb = await RefreshToken.findOne({
      userId: user._id,
      token: refreshToken,
    });

    if (!refreshTokenFromDb) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    // if (refreshTokenFromDb.expiresAt < Date.now()) {
    //   return res.status(401).json({ status: "error", message: "Unauthorized" });
    // }

    const userToken = generateUserToken(user);
    const userRefreshToken = generateUserRefreshToken(user._id);

    //Delete old refresh token to invalidate it
    await RefreshToken.deleteOne({
      userId: user._id,
      token: refreshToken,
    });

    await RefreshToken.create({
      userId: user._id,
      token: userRefreshToken,
    });

    res.json({
      token: userToken,
      refreshToken: userRefreshToken,
    });
  } catch (error) {
    let message = error.message;
    if (process.env.APP_ENV === "production") {
      message = "Something went wrong";
    }
    res.status(400).json({ status: "error", message });
  }
});

// Get user details route
router.get("/user", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1] ?? null;

    if (!token) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);

    res.json({ status: "success", user });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
});

module.exports = router;
