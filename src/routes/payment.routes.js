const express = require("express");
const {
  createCheckoutSession,
  getAllPayments,
  verifyCheckoutSession,
} = require("../controllers/payment.controller");
const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");

const router = express.Router();

router.post("/create-checkout-session", verifyToken, createCheckoutSession);
router.post("/verify-session", verifyToken, verifyCheckoutSession);
router.get("/", verifyToken, verifyRole("admin"), getAllPayments);

module.exports = router;
