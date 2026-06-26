const express = require("express");
const {
  createReview,
  getPromptReviews,
  getMyReviews,
  getRecentReviews,
} = require("../controllers/review.controller");
const verifyToken = require("../middlewares/verifyToken");
const optionalAuth = require("../middlewares/optionalAuth");

const router = express.Router();

router.get("/recent", optionalAuth, getRecentReviews);
router.get("/me", verifyToken, getMyReviews);
router.get("/prompt/:promptId", optionalAuth, getPromptReviews);
router.post("/:promptId", verifyToken, createReview);

module.exports = router;
