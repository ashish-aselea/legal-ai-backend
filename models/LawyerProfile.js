const mongoose = require("mongoose");
const { CONSULTATION_TYPES } = require("./Booking");

const LAWYER_TYPES = {
  PRACTICING_LAWYER: "Practicing lawyer",
  RETIRED_JUDGE: "Retired judge",
};

const APPROVAL_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

const AVAILABILITY_STATUS = {
  AVAILABLE: "Available",
  BUSY: "Busy",
};

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const lawyerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    iAmA: {
      type: String,
      enum: Object.values(LAWYER_TYPES),
      required: true,
    },
    barCouncilEnrollmentNumber: { type: String, required: true, trim: true },
    // Not a hardcoded enum: valid values live in the PracticeArea collection so
    // admins can add new categories without a code change. Validated in the
    // controller against PracticeArea before save.
    practiceArea: { type: String, required: true, trim: true },
    yearsOfExperience: { type: Number, required: true, min: 0 },
    cityJurisdiction: { type: String, required: true, trim: true },
    approvalStatus: {
      type: String,
      enum: Object.values(APPROVAL_STATUS),
      default: APPROVAL_STATUS.PENDING,
      index: true,
    },
    rejectionReason: { type: String, trim: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    // Set by the lawyer themselves from their profile, shown on the "Find a lawyer" listing.
    pricePerSession: { type: Number, min: 0, default: null },
    availabilityStatus: {
      type: String,
      enum: Object.values(AVAILABILITY_STATUS),
      default: AVAILABILITY_STATUS.AVAILABLE,
    },
    // Shown on the lawyer profile screen; the lawyer sets these from their own profile.
    bio: { type: String, trim: true, default: "" },
    specializations: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    // Charged for Audio/Video consultations, billed per minute. pricePerSession
    // covers Chat / a fixed-length booking; this is separate and optional.
    callFeePerMinute: { type: Number, min: 0, default: null },
    // Populated later by the booking/review system; defaults keep the listing card renderable now.
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    consultsCount: { type: Number, default: 0 },
    // Not lawyer-editable — set by admin / a future case-management flow, same
    // reasoning as consultsCount (a self-reported number would be meaningless).
    casesHandled: { type: Number, default: 0 },
    // Which consultation types this lawyer currently accepts bookings for.
    // Defaults to all three so existing lawyers keep working as before this field existed.
    // Toggled one at a time via PATCH /lawyers/me/consultation-types/:type.
    supportedConsultationTypes: {
      type: [String],
      enum: Object.values(CONSULTATION_TYPES),
      default: Object.values(CONSULTATION_TYPES),
    },
    // Which weekdays this lawyer accepts bookings on. Time-of-day within a day
    // is still governed by the fixed TIME_SLOTS in Booking.js — this only
    // gates whole days on/off. Defaults to every day so existing lawyers keep
    // working as before this field existed.
    availableDays: {
      type: [String],
      enum: DAYS_OF_WEEK,
      default: DAYS_OF_WEEK,
    },
  },
  { timestamps: true }
);

const LawyerProfile = mongoose.model("LawyerProfile", lawyerProfileSchema);

module.exports = {
  LawyerProfile,
  LAWYER_TYPES,
  APPROVAL_STATUS,
  AVAILABILITY_STATUS,
  DAYS_OF_WEEK,
};
