const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");

const User = require("../models/User.model");
const generateToken = require("../utils/generateToken");

const buildCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const sendAuthResponse = (res, user, statusCode = 200) => {
  const token = generateToken({
    id: user._id,
    email: user.email,
    role: user.role,
  });

  const userResponse = user.toObject ? user.toObject() : user;
  delete userResponse.password;

  return res
    .status(statusCode)
    .cookie("token", token, buildCookieOptions())
    .json({
      success: true,
      message: "Authentication successful",
      data: userResponse,
    });
};

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
      });
    }

    const { name, email, password, photoURL } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      photoURL: photoURL?.trim() || "",
      role: "user",
    });

    return sendAuthResponse(res, user, 201);
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
      });
    }

    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    user.password = undefined;
    return sendAuthResponse(res, user);
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res) => {
  return res
    .clearCookie("token", buildCookieOptions())
    .status(200)
    .json({
      success: true,
      message: "Logged out successfully",
    });
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};

const googleSync = async (req, res, next) => {
  try {
    const { name, email, photoURL, firebaseUid } = req.body;

    if (!name || !email || !firebaseUid) {
      return res.status(400).json({
        success: false,
        message: "name, email, and firebaseUid are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const updateFields = {
      name: name.trim(),
      email: normalizedEmail,
      photoURL: photoURL?.trim() || "",
      firebaseUid,
    };

    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: updateFields,
        $setOnInsert: {
          role: "user",
          isPremium: false,
          promptCount: 0,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return sendAuthResponse(res, user, 200);
  } catch (error) {
    return next(error);
  }
};

const seedAdminUser = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return;
  }

  const existingAdmin = await User.findOne({ email: adminEmail.trim().toLowerCase(), role: "admin" });

  if (existingAdmin) {
    return;
  }

  const existingUser = await User.findOne({ email: adminEmail.trim().toLowerCase() });

  if (existingUser) {
    existingUser.role = "admin";
    existingUser.password = adminPassword;
    existingUser.firebaseUid = undefined;
    await existingUser.save();
    return;
  }

  await User.create({
    name: "Admin",
    email: adminEmail.trim().toLowerCase(),
    password: adminPassword,
    role: "admin",
  });
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  googleSync,
  seedAdminUser,
  buildCookieOptions,
};