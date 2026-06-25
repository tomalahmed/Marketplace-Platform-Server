const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    photoURL: {
      type: String,
      default: "",
      trim: true,
    },
    password: {
      type: String,
      select: false,
      required: function requiredPassword() {
        return !this.firebaseUid;
      },
    },
    role: {
      type: String,
      enum: ["user", "creator", "admin"],
      default: "user",
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    promptCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password") || !this.password) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);

module.exports = User;