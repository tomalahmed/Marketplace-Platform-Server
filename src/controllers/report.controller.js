const Report = require("../models/Report.model");
const Prompt = require("../models/Prompt.model");

const isValidObjectId = (id) => id && /^[0-9a-fA-F]{24}$/.test(id);

const VALID_REASONS = [
  "Inappropriate",
  "Spam",
  "Copyright",
  "Inaccurate",
  "Offensive",
  "Other",
];

exports.createReport = async (req, res, next) => {
  try {
    const { promptId } = req.params;
    const { reason, description = "" } = req.body;

    if (!isValidObjectId(promptId)) {
      return res.status(400).json({ success: false, message: "Invalid prompt ID" });
    }

    if (!reason || !VALID_REASONS.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: "A valid report reason is required",
      });
    }

    const prompt = await Prompt.findById(promptId);
    if (!prompt) {
      return res.status(404).json({ success: false, message: "Prompt not found" });
    }

    const report = await Report.create({
      user: req.user.id,
      prompt: promptId,
      reason,
      description: String(description).trim(),
    });

    await report.populate("user", "name email");
    await report.populate("prompt", "title");

    return res.status(201).json({
      success: true,
      message: "Report submitted successfully",
      data: report,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getAllReports = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 20, 1);
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name email")
        .populate("prompt", "title"),
      Report.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      results: reports.length,
      pagination: {
        page,
        limit,
        totalCount: total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
      data: reports,
    });
  } catch (error) {
    return next(error);
  }
};
