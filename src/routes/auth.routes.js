const express = require("express");
const { body } = require("express-validator");

const authController = require("../controllers/auth.controller");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("photoURL").optional({ checkFalsy: true }).isURL().withMessage("PhotoURL must be a valid URL"),
  ],
  authController.register
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  authController.login
);

router.post("/logout", authController.logout);

router.get("/me", verifyToken, authController.getMe);

router.post("/google-sync", authController.googleSync);

module.exports = router;