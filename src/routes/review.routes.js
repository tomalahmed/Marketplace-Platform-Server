const express = require("express");
const {
  createReview,
  getPromptReviews,
  getMyReviews,
  getRecentReviews,
} = require("../controllers/review.controller");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

router.get("/recent", getRecentReviews);
router.get("/me", verifyToken, getMyReviews);
router.get("/prompt/:promptId", getPromptReviews);
router.post("/:promptId", verifyToken, createReview);

module.exports = router;
