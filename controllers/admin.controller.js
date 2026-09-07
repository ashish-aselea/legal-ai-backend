const { AppError } = require("../middleware/errorHandler");
const { asyncHandler } = require("../utils/asyncHandler");
const { LawyerProfile, APPROVAL_STATUS } = require("../models/LawyerProfile");
const { User, USER_ROLES } = require("../models/User");
const { Booking, BOOKING_STATUS } = require("../models/Booking");

// GET /api/v1/admin/lawyers?status=pending
exports.listLawyers = asyncHandler(async (req, res) => {
  const { status } = req.query;

  if (status && !Object.values(APPROVAL_STATUS).includes(status)) {
    throw new AppError("Invalid status filter", 400);
  }

  const profiles = await LawyerProfile.find(status ? { approvalStatus: status } : {})
    .populate("user", "name email mobile role isBlocked")
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: profiles.length,
    data: { lawyers: profiles },
  });
});

const review = async (req, res, approvalStatus, rejectionReason) => {
  const profile = await LawyerProfile.findByIdAndUpdate(
    req.params.id,
    {
      approvalStatus,
      rejectionReason,
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
    },
    { new: true }
  ).populate("user", "name email mobile role");

  if (!profile) {
    throw new AppError("Lawyer profile not found", 404);
  }

  res.status(200).json({
    status: "success",
    message: `Lawyer ${approvalStatus}`,
    data: { lawyer: profile },
  });
};

// PATCH /api/v1/admin/lawyers/:id/approve
exports.approveLawyer = asyncHandler(async (req, res) => {
  await review(req, res, APPROVAL_STATUS.APPROVED);
});

// PATCH /api/v1/admin/lawyers/:id/reject
exports.rejectLawyer = asyncHandler(async (req, res) => {
  await review(req, res, APPROVAL_STATUS.REJECTED, req.body.rejectionReason);
});

const buildUserSummary = (user) => ({
  id: String(user._id),
  mobile: user.mobile,
  role: user.role,
  name: user.name,
  email: user.email,
  city: user.city,
  isBlocked: user.isBlocked,
  blockedReason: user.blockedReason,
  blockedAt: user.blockedAt,
  createdAt: user.createdAt,
});

// GET /api/v1/admin/users?role=user&isBlocked=true&search=ravi
exports.listUsers = asyncHandler(async (req, res) => {
  const { role, isBlocked, search } = req.query;

  const match = {};
  if (role) {
    if (!Object.values(USER_ROLES).includes(role)) {
      throw new AppError("Invalid role filter", 400);
    }
    match.role = role;
  }
  if (isBlocked !== undefined) {
    match.isBlocked = isBlocked === "true";
  }

  let users = await User.find(match).sort({ createdAt: -1 });

  if (search) {
    const re = new RegExp(search, "i");
    users = users.filter((u) => re.test(u.name || "") || re.test(u.mobile) || re.test(u.email || ""));
  }

  res.status(200).json({
    status: "success",
    results: users.length,
    data: { users: users.map(buildUserSummary) },
  });
});

// PATCH /api/v1/admin/users/:id/block
exports.blockUser = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) {
    throw new AppError("User not found", 404);
  }
  if (target.role === USER_ROLES.ADMIN) {
    throw new AppError("Admin accounts cannot be blocked", 400);
  }

  target.isBlocked = true;
  target.blockedReason = req.body.reason || null;
  target.blockedAt = new Date();
  target.blockedBy = req.user.id;
  await target.save();

  res.status(200).json({
    status: "success",
    message: "User blocked",
    data: { user: buildUserSummary(target) },
  });
});

// PATCH /api/v1/admin/users/:id/unblock
exports.unblockUser = asyncHandler(async (req, res) => {
  const target = await User.findByIdAndUpdate(
    req.params.id,
    { isBlocked: false, blockedReason: null, blockedAt: null, blockedBy: null },
    { new: true }
  );

  if (!target) {
    throw new AppError("User not found", 404);
  }

  res.status(200).json({
    status: "success",
    message: "User unblocked",
    data: { user: buildUserSummary(target) },
  });
});

// GET /api/v1/admin/consultations?status=confirmed&search=ravi
exports.listConsultations = asyncHandler(async (req, res) => {
  const { status, search } = req.query;

  if (status && !Object.values(BOOKING_STATUS).includes(status)) {
    throw new AppError("Invalid status filter", 400);
  }

  let bookings = await Booking.find(status ? { status } : {})
    .populate("user", "name mobile")
    .populate({ path: "lawyer", populate: { path: "user", select: "name" } })
    .sort({ createdAt: -1 });

  if (search) {
    const re = new RegExp(search, "i");
    bookings = bookings.filter(
      (b) => re.test(b.user?.name || "") || re.test(b.lawyer?.user?.name || "")
    );
  }

  res.status(200).json({
    status: "success",
    results: bookings.length,
    data: {
      consultations: bookings.map((b) => ({
        id: String(b._id),
        user: b.user ? { id: String(b.user._id), name: b.user.name, mobile: b.user.mobile } : null,
        lawyer: b.lawyer
          ? { id: String(b.lawyer._id), name: b.lawyer.user?.name, practiceArea: b.lawyer.practiceArea }
          : null,
        consultationType: b.consultationType,
        date: b.date,
        timeSlot: b.timeSlot,
        amount: b.amount,
        status: b.status,
        createdAt: b.createdAt,
      })),
    },
  });
});
