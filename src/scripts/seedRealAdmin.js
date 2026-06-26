const bcrypt = require("bcryptjs");
const User = require("../models/User.model");
const { getRealAdminConfig } = require("../config/realAdmin");

async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

/**
 * Upsert the real platform admin from REAL_ADMIN_* env vars.
 * Not demo-scoped — sees all production data.
 */
async function seedRealAdmin({ requireCredentials = false } = {}) {
  const config = getRealAdminConfig({
    requireEmail: requireCredentials,
    requirePassword: requireCredentials,
  });

  if (!config.hasEmail) {
    if (requireCredentials) {
      throw new Error("REAL_ADMIN_EMAIL is not configured.");
    }
    return { skipped: true, reason: "REAL_ADMIN_EMAIL not set" };
  }

  if (!config.password) {
    if (requireCredentials) {
      throw new Error("REAL_ADMIN_PASSWORD is not configured.");
    }
    return {
      skipped: true,
      reason: "REAL_ADMIN_PASSWORD not set (run npm run seed:admin after setting it)",
    };
  }

  const hashedPassword = await hashPassword(config.password);

  const user = await User.findOneAndUpdate(
    { email: config.email },
    {
      $set: {
        name: config.name,
        email: config.email,
        role: "admin",
        isPremium: true,
        password: hashedPassword,
      },
      $setOnInsert: {
        photoURL: "",
        promptCount: 0,
      },
    },
    { upsert: true, runValidators: true, new: true, setDefaultsOnInsert: true }
  );

  return { skipped: false, user };
}

module.exports = {
  seedRealAdmin,
};
