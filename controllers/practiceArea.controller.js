const { AppError } = require("../middleware/errorHandler");
const { asyncHandler } = require("../utils/asyncHandler");
const { PracticeArea } = require("../models/PracticeArea");

const buildResponse = (doc) => ({
  id: String(doc._id),
  name: doc.name,
  isActive: doc.isActive,
});

// GET /api/v1/practice-areas
// Public — powers the signup dropdown and the "Find a lawyer" filter chips.
exports.listActivePracticeAreas = asyncHandler(async (req, res) => {
  const areas = await PracticeArea.find({ isActive: true }).sort({ name: 1 });

  res.status(200).json({
    status: "success",
    results: areas.length,
    data: { practiceAreas: areas.map((a) => a.name) },
  });
});

// GET /api/v1/admin/practice-areas
// Admin — includes inactive ones so they can be reactivated.
exports.listAllPracticeAreas = asyncHandler(async (req, res) => {
  const areas = await PracticeArea.find().sort({ name: 1 });

  res.status(200).json({
    status: "success",
    results: areas.length,
    data: { practiceAreas: areas.map(buildResponse) },
  });
});

// POST /api/v1/admin/practice-areas
exports.createPracticeArea = asyncHandler(async (req, res) => {
  const { name } = req.body;

  const existing = await PracticeArea.findOne({ name });
  if (existing) {
    throw new AppError("This practice area already exists", 409);
  }

  const area = await PracticeArea.create({ name });

  res.status(201).json({
    status: "success",
    message: "Practice area created",
    data: { practiceArea: buildResponse(area) },
  });
});

// PATCH /api/v1/admin/practice-areas/:id
// Used to rename, or to activate/deactivate (soft delete) a practice area.
exports.updatePracticeArea = asyncHandler(async (req, res) => {
  if (req.body.name) {
    const existing = await PracticeArea.findOne({ name: req.body.name, _id: { $ne: req.params.id } });
    if (existing) {
      throw new AppError("This practice area already exists", 409);
    }
  }

  const area = await PracticeArea.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });

  if (!area) {
    throw new AppError("Practice area not found", 404);
  }

  res.status(200).json({
    status: "success",
    message: "Practice area updated",
    data: { practiceArea: buildResponse(area) },
  });
});
