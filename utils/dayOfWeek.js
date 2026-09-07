const { DAYS_OF_WEEK } = require("../models/LawyerProfile");

// "2026-09-08" -> "Tue". Parsed as UTC midnight so it matches the plain
// YYYY-MM-DD date strings used everywhere else in the booking flow, with no
// local-timezone drift.
const dayAbbrForDate = (dateStr) => {
  const jsDay = new Date(`${dateStr}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return jsDay === 0 ? DAYS_OF_WEEK[6] : DAYS_OF_WEEK[jsDay - 1];
};

module.exports = { dayAbbrForDate };
