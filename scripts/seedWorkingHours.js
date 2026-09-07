const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const { WorkingHours } = require("../models/WorkingHours");
const { DAYS_OF_WEEK } = require("../models/LawyerProfile");

const run = async () => {
  await connectDB();

  for (const day of DAYS_OF_WEEK) {
    await WorkingHours.findOneAndUpdate(
      { day },
      { day, startTime: "10:00 AM", endTime: "6:00 PM" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  console.log(`Seeded working hours for: ${DAYS_OF_WEEK.join(", ")}`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
