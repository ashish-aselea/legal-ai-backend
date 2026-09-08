const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const { WalletPresetAmount } = require("../models/WalletPresetAmount");

const DEFAULT_AMOUNTS = [10, 50, 100, 200, 500, 1000, 2000, 3000, 4000, 8000, 15000, 20000, 50000, 100000];

const run = async () => {
  await connectDB();

  for (const amount of DEFAULT_AMOUNTS) {
    await WalletPresetAmount.findOneAndUpdate(
      { amount },
      { amount, isActive: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  console.log(`Seeded wallet preset amounts: ${DEFAULT_AMOUNTS.join(", ")}`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
