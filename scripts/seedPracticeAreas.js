const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const { PracticeArea } = require("../models/PracticeArea");

const DEFAULT_PRACTICE_AREAS = ["Criminal", "Family", "Corporate & Civil", "Judicial"];

const run = async () => {
  await connectDB();

  for (const name of DEFAULT_PRACTICE_AREAS) {
    await PracticeArea.findOneAndUpdate(
      { name },
      { name, isActive: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  console.log(`Seeded practice areas: ${DEFAULT_PRACTICE_AREAS.join(", ")}`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
