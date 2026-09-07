const { AppError } = require("../middleware/errorHandler");
const { asyncHandler } = require("../utils/asyncHandler");
const { LawyerProfile, APPROVAL_STATUS } = require("../models/LawyerProfile");
const { User } = require("../models/User");
const { Review } = require("../models/Review");
const { Booking, TIME_SLOTS, BOOKING_STATUS, CONSULTATION_TYPES } = require("../models/Booking");

const buildLawyerCard = (profile) => ({
  id: String(profile._id),
  name: profile.user.name,
  profilePhotoUrl: profile.user.profilePhotoUrl,
  iAmA: profile.iAmA,
  practiceArea: profile.practiceArea,
  yearsOfExperience: profile.yearsOfExperience,
  cityJurisdiction: profile.cityJurisdiction,
  availabilityStatus: profile.availabilityStatus,
  pricePerSession: profile.pricePerSession,
  callFeePerMinute: profile.callFeePerMinute,
  supportedConsultationTypes: profile.supportedConsultationTypes,
  ratingAverage: profile.ratingAverage,
  ratingCount: profile.ratingCount,
  // Only approved lawyers are ever returned, so this is always true here; sent
  // so the app can render the badge without hardcoding it.
  isKycVerified: profile.approvalStatus === APPROVAL_STATUS.APPROVED,
});

const buildLawyerDetail = (profile) => ({
  ...buildLawyerCard(profile),
  bio: profile.bio,
  specializations: profile.specializations,
  languages: profile.languages,
  consultsCount: profile.consultsCount,
  casesHandled: profile.casesHandled,
});

// GET /api/v1/lawyers?practiceArea=Criminal&search=jaipur
exports.listLawyers = asyncHandler(async (req, res) => {
  const { practiceArea, search } = req.query;

  const match = { approvalStatus: APPROVAL_STATUS.APPROVED };
  if (practiceArea) {
    match.practiceArea = practiceArea;
  }

  let profiles = await LawyerProfile.find(match)
    .populate("user", "name profilePhotoUrl isBlocked")
    .sort({ createdAt: -1 });

  // A blocked lawyer must disappear from discovery even though their profile stays approved.
  profiles = profiles.filter((p) => !p.user.isBlocked);

  if (search) {
    const re = new RegExp(search, "i");
    profiles = profiles.filter(
      (p) => re.test(p.user.name) || re.test(p.practiceArea) || re.test(p.cityJurisdiction)
    );
  }

  res.status(200).json({
    status: "success",
    results: profiles.length,
    data: { lawyers: profiles.map(buildLawyerCard) },
  });
});

// GET /api/v1/lawyers/:id
exports.getLawyerById = asyncHandler(async (req, res) => {
  const profile = await LawyerProfile.findOne({
    _id: req.params.id,
    approvalStatus: APPROVAL_STATUS.APPROVED,
  }).populate("user", "name profilePhotoUrl isBlocked");

  if (!profile || profile.user.isBlocked) {
    throw new AppError("Lawyer not found", 404);
  }

  res.status(200).json({
    status: "success",
    data: { lawyer: buildLawyerDetail(profile) },
  });
});

// GET /api/v1/lawyers/:id/reviews
exports.getLawyerReviews = asyncHandler(async (req, res) => {
  const profile = await LawyerProfile.findOne({
    _id: req.params.id,
    approvalStatus: APPROVAL_STATUS.APPROVED,
  });

  if (!profile) {
    throw new AppError("Lawyer not found", 404);
  }

  const reviews = await Review.find({ lawyer: profile._id })
    .populate("user", "name")
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: reviews.length,
    data: {
      ratingAverage: profile.ratingAverage,
      ratingCount: profile.ratingCount,
      reviews: reviews.map((review) => ({
        id: String(review._id),
        reviewerName: review.user.name,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      })),
    },
  });
});

// GET /api/v1/lawyers/:id/availability?date=YYYY-MM-DD
exports.getLawyerAvailability = asyncHandler(async (req, res) => {
  const { date } = req.query;

  const profile = await LawyerProfile.findOne({
    _id: req.params.id,
    approvalStatus: APPROVAL_STATUS.APPROVED,
  });

  if (!profile) {
    throw new AppError("Lawyer not found", 404);
  }

  const taken = await Booking.find({
    lawyer: profile._id,
    date,
    status: { $in: [BOOKING_STATUS.PENDING_PAYMENT, BOOKING_STATUS.CONFIRMED] },
  }).distinct("timeSlot");

  res.status(200).json({
    status: "success",
    data: {
      date,
      pricePerSession: profile.pricePerSession,
      slots: TIME_SLOTS.map((slot) => ({
        timeSlot: slot,
        isAvailable: !taken.includes(slot),
      })),
    },
  });
});

// PATCH /api/v1/lawyers/me  (single "Edit Profile" call — name/email live on
// User, everything else on LawyerProfile, so this splits the body and updates both)
exports.updateMyLawyerProfile = asyncHandler(async (req, res) => {
  const { name, email, ...profileFields } = req.body;

  if (name !== undefined || email !== undefined) {
    await User.findByIdAndUpdate(req.user.id, {
      $set: { ...(name !== undefined && { name }), ...(email !== undefined && { email }) },
    });
  }

  const profile = Object.keys(profileFields).length
    ? await LawyerProfile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      ).populate("user", "name profilePhotoUrl")
    : await LawyerProfile.findOne({ user: req.user.id }).populate("user", "name profilePhotoUrl");

  if (!profile) {
    throw new AppError("Lawyer profile not found", 404);
  }

  res.status(200).json({
    status: "success",
    data: { lawyer: buildLawyerDetail(profile) },
  });
});

const TYPE_PARAM_MAP = {
  chat: CONSULTATION_TYPES.CHAT,
  audio: CONSULTATION_TYPES.AUDIO,
  video: CONSULTATION_TYPES.VIDEO,
};

// PATCH /api/v1/lawyers/me/consultation-types/:type  (type: chat | audio | video)
// One endpoint per type, toggled independently — e.g. a lawyer can turn off
// Video while keeping Chat and Audio on.
exports.updateConsultationTypeAvailability = asyncHandler(async (req, res) => {
  const type = TYPE_PARAM_MAP[req.params.type.toLowerCase()];
  if (!type) {
    throw new AppError("Invalid consultation type in URL. Use chat, audio or video.", 400);
  }

  const profile = await LawyerProfile.findOne({ user: req.user.id });
  if (!profile) {
    throw new AppError("Lawyer profile not found", 404);
  }

  const current = new Set(profile.supportedConsultationTypes);
  if (req.body.available) {
    current.add(type);
  } else {
    current.delete(type);
  }
  profile.supportedConsultationTypes = Array.from(current);
  await profile.save();
  await profile.populate("user", "name profilePhotoUrl");

  res.status(200).json({
    status: "success",
    message: `${type} consultations ${req.body.available ? "enabled" : "disabled"}`,
    data: { lawyer: buildLawyerDetail(profile) },
  });
});

// Shared by the single-field price endpoints below.
const setOwnProfileField = async (req, res, field, message) => {
  const profile = await LawyerProfile.findOneAndUpdate(
    { user: req.user.id },
    { $set: { [field]: req.body[field] } },
    { new: true }
  ).populate("user", "name profilePhotoUrl");

  if (!profile) {
    throw new AppError("Lawyer profile not found", 404);
  }

  res.status(200).json({
    status: "success",
    message,
    data: { lawyer: buildLawyerDetail(profile) },
  });
};

// PATCH /api/v1/lawyers/me/consultation-fee  (bills a Chat / fixed session)
exports.updatePricePerSession = asyncHandler(async (req, res) => {
  await setOwnProfileField(req, res, "pricePerSession", "Consultation fee updated");
});

// PATCH /api/v1/lawyers/me/call-fee-per-minute  (bills Audio/Video by the minute)
exports.updateCallFeePerMinute = asyncHandler(async (req, res) => {
  await setOwnProfileField(req, res, "callFeePerMinute", "Per-minute call fee updated");
});
