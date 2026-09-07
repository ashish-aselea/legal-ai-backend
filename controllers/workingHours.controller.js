const { AppError } = require("../middleware/errorHandler");
const { asyncHandler } = require("../utils/asyncHandler");
const { WorkingHours } = require("../models/WorkingHours");
const { DAYS_OF_WEEK } = require("../models/LawyerProfile");

const DAY_ORDER = DAYS_OF_WEEK.reduce((acc, day, i) => ({ ...acc, [day]: i }), {});
const DAY_PARAM_MAP = DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day.toLowerCase()]: day }), {});

const buildResponse = (doc) => ({ day: doc.day, startTime: doc.startTime, endTime: doc.endTime });

const sortedByWeekday = (docs) => [...docs].sort((a, b) => DAY_ORDER[a.day] - DAY_ORDER[b.day]);

// GET /api/v1/working-hours
// Public — the "Set availability" screen renders each day's time range from
// this before the lawyer toggles which days apply to them.
exports.listWorkingHours = asyncHandler(async (req, res) => {
  const docs = await WorkingHours.find();

  res.status(200).json({
    status: "success",
    data: { workingHours: sortedByWeekday(docs).map(buildResponse) },
  });
});

// PATCH /api/v1/admin/working-hours/:day  (day: mon | tue | wed | thu | fri | sat | sun)
// One endpoint per day, same pattern as the lawyer consultation-type toggles —
// admin sets each day's time range independently.
exports.updateWorkingHours = asyncHandler(async (req, res) => {
  const day = DAY_PARAM_MAP[req.params.day.toLowerCase()];
  if (!day) {
    throw new AppError("Invalid day in URL. Use mon, tue, wed, thu, fri, sat or sun.", 400);
  }

  const doc = await WorkingHours.findOneAndUpdate(
    { day },
    { $set: { startTime: req.body.startTime, endTime: req.body.endTime } },
    { new: true }
  );

  if (!doc) {
    throw new AppError(`Working hours for ${day} have not been seeded yet`, 404);
  }

  res.status(200).json({
    status: "success",
    message: `${day} working hours updated`,
    data: { workingHours: buildResponse(doc) },
  });
});
