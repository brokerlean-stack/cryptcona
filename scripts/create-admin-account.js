const { loadEnvConfig } = require("@next/env");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
loadEnvConfig(process.cwd());
(async () => {
  try {
    const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    if (
      !MONGODB_URI ||
      !ADMIN_EMAIL ||
      !ADMIN_PASSWORD
    )
      throw new Error(
        "Set MONGODB_URI, ADMIN_EMAIL and ADMIN_PASSWORD in .env.local.",
      );
    await mongoose.connect(MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || "cryptcona_broker",
      serverSelectionTimeoutMS: 8000,
    });
    const users = mongoose.connection.collection("users");
    const email = ADMIN_EMAIL.toLowerCase().trim();
    const password = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await users.updateOne(
      { email },
      {
        $set: {
          password,
          role: "admin",
          isVerified: true,
          status: "active",
          updatedAt: new Date(),
        },
        $setOnInsert: {
          email,
          name: "Cryptcona Administrator",
          balance: 0,
          currency: "USD",
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
    console.log(
      "Cryptcona admin account is ready. Existing balances were preserved.",
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
