const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (error) {
    if (
      error.message?.includes("whitelist") ||
      error.message?.includes("Could not connect to any servers")
    ) {
      throw new Error(
        "MongoDB Atlas connection failed. Add your current IP to Atlas → Network Access → IP Access List (or use 0.0.0.0/0 for development). See https://www.mongodb.com/docs/atlas/security-whitelist/"
      );
    }
    throw error;
  }
};

module.exports = connectDB;
