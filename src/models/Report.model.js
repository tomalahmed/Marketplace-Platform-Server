const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    prompt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prompt",
      required: true,
    },
    reason: {
      type: String,
      enum: ["Inappropriate", "Spam", "Copyright", "Inaccurate", "Offensive", "Other"],
      required: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["pending", "dismissed", "resolved"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ prompt: 1, createdAt: -1 });
reportSchema.index({ status: 1, createdAt: -1 });

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;
