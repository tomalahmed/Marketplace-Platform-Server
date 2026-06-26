require("dotenv").config();

const mongoose = require("mongoose");
const { getRealAdminConfig } = require("../config/realAdmin");
const { seedRealAdmin } = require("./seedRealAdmin");

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined in .env");
  }

  const config = getRealAdminConfig({ requireEmail: true, requirePassword: true });

  await mongoose.connect(uri);
  console.log("MongoDB connected");

  const result = await seedRealAdmin({ requireCredentials: true });

  if (result.skipped || !result.user) {
    throw new Error(result.reason || "Failed to seed real admin");
  }

  console.log(`Real admin ready: ${result.user.email} (role: ${result.user.role})`);
  console.log(`Display name: ${result.user.name}`);
  console.log("Full platform access — not demo-scoped.");
  console.log("");
  console.log("To change the admin email later, update REAL_ADMIN_EMAIL in .env and run:");
  console.log("  npm run seed:admin");
}

run()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("seed:admin failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  });
