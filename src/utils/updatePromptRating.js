const mongoose = require("mongoose");
const Review = require("../models/Review.model");
const Prompt = require("../models/Prompt.model");

async function updatePromptRating(promptId) {
  if (!promptId || !mongoose.Types.ObjectId.isValid(promptId)) {
    return;
  }

  const [stats] = await Review.aggregate([
    { $match: { prompt: new mongoose.Types.ObjectId(promptId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  await Prompt.findByIdAndUpdate(promptId, {
    averageRating: stats ? Math.round(stats.averageRating * 10) / 10 : 0,
    reviewCount: stats?.reviewCount || 0,
  });
}

module.exports = updatePromptRating;
