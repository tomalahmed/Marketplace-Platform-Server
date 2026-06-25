const express = require("express");
const { createReport, getAllReports } = require("../controllers/report.controller");
const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");

const router = express.Router();

router.post("/:promptId", verifyToken, createReport);
router.get("/", verifyToken, verifyRole("admin"), getAllReports);

module.exports = router;
