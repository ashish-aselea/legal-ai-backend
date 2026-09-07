const mongoose = require("mongoose");
const { DAYS_OF_WEEK } = require("./LawyerProfile");

// Exactly one document per weekday (seeded once, never created/deleted after
// that) — admin sets the display time range for that day; lawyers only
// toggle which of these days they personally work (see LawyerProfile.availableDays).
// Purely a display window, not linked to the fixed booking TIME_SLOTS.
const workingHoursSchema = new mongoose.Schema(
  {
    day: { type: String, enum: DAYS_OF_WEEK, required: true, unique: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const WorkingHours = mongoose.model("WorkingHours", workingHoursSchema);

module.exports = { WorkingHours };
