const express = require("express");
const {
  toggleBookmark,
  checkBookmark,
  getMyBookmarks,
} = require("../controllers/bookmark.controller");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

router.use(verifyToken);

router.get("/", getMyBookmarks);
router.get("/check/:promptId", checkBookmark);
router.post("/:promptId", toggleBookmark);

module.exports = router;
