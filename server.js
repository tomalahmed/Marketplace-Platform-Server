require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/db");
const { seedAdminUser } = require("./src/controllers/auth.controller");

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    return seedAdminUser();
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  });
