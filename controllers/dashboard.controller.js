const { asyncHandler } = require("../utils/asyncHandler");
const { User, USER_ROLES } = require("../models/User");
const { LawyerProfile, APPROVAL_STATUS } = require("../models/LawyerProfile");
const { Booking, BOOKING_STATUS } = require("../models/Booking");

// Counts documents created in the 7 days before `days` ago, so the caller can
// show a "vs last week" delta without a second round of queries.
const percentChange = (current, previous) => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

const startOfDaysAgo = (days) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
};

// GET /api/v1/admin/dashboard/stats
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const last7 = startOfDaysAgo(7);
  const last14 = startOfDaysAgo(14);

  const [
    totalUsers,
    usersThisWeek,
    usersLastWeek,
    verifiedLawyers,
    lawyersThisWeek,
    lawyersLastWeek,
    consultations,
    consultsThisWeek,
    consultsLastWeek,
    pendingApprovals,
    pendingThisWeek,
    pendingLastWeek,
  ] = await Promise.all([
    User.countDocuments({ role: USER_ROLES.USER }),
    User.countDocuments({ role: USER_ROLES.USER, createdAt: { $gte: last7 } }),
    User.countDocuments({ role: USER_ROLES.USER, createdAt: { $gte: last14, $lt: last7 } }),
    LawyerProfile.countDocuments({ approvalStatus: APPROVAL_STATUS.APPROVED }),
    LawyerProfile.countDocuments({
      approvalStatus: APPROVAL_STATUS.APPROVED,
      createdAt: { $gte: last7 },
    }),
    LawyerProfile.countDocuments({
      approvalStatus: APPROVAL_STATUS.APPROVED,
      createdAt: { $gte: last14, $lt: last7 },
    }),
    Booking.countDocuments({ status: BOOKING_STATUS.CONFIRMED }),
    Booking.countDocuments({ status: BOOKING_STATUS.CONFIRMED, createdAt: { $gte: last7 } }),
    Booking.countDocuments({
      status: BOOKING_STATUS.CONFIRMED,
      createdAt: { $gte: last14, $lt: last7 },
    }),
    LawyerProfile.countDocuments({ approvalStatus: APPROVAL_STATUS.PENDING }),
    LawyerProfile.countDocuments({
      approvalStatus: APPROVAL_STATUS.PENDING,
      createdAt: { $gte: last7 },
    }),
    LawyerProfile.countDocuments({
      approvalStatus: APPROVAL_STATUS.PENDING,
      createdAt: { $gte: last14, $lt: last7 },
    }),
  ]);

  res.status(200).json({
    status: "success",
    data: {
      stats: {
        totalUsers: { value: totalUsers, changePercent: percentChange(usersThisWeek, usersLastWeek) },
        verifiedLawyers: {
          value: verifiedLawyers,
          changePercent: percentChange(lawyersThisWeek, lawyersLastWeek),
        },
        consultations: {
          value: consultations,
          changePercent: percentChange(consultsThisWeek, consultsLastWeek),
        },
        pendingApprovals: {
          value: pendingApprovals,
          changePercent: percentChange(pendingThisWeek, pendingLastWeek),
        },
      },
    },
  });
});

// GET /api/v1/admin/dashboard/user-growth?days=7
exports.getUserGrowth = asyncHandler(async (req, res) => {
  const days = Math.min(parseInt(req.query.days || "7", 10), 90);
  const from = startOfDaysAgo(days - 1);

  const rows = await User.aggregate([
    { $match: { role: USER_ROLES.USER, createdAt: { $gte: from } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
  ]);

  const perDay = new Map(rows.map((r) => [r._id, r.count]));

  // Running total so the chart shows cumulative growth, not daily spikes.
  const baseline = await User.countDocuments({ role: USER_ROLES.USER, createdAt: { $lt: from } });

  let running = baseline;
  const points = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    running += perDay.get(key) || 0;
    points.push({ date: key, totalUsers: running });
  }

  res.status(200).json({
    status: "success",
    data: { days, points },
  });
});

// GET /api/v1/admin/dashboard/recent
exports.getRecentActivity = asyncHandler(async (req, res) => {
  const [recentUsers, recentApplications] = await Promise.all([
    User.find({ role: { $in: [USER_ROLES.USER, USER_ROLES.LAWYER] } })
      .sort({ createdAt: -1 })
      .limit(5),
    LawyerProfile.find().populate("user", "name mobile").sort({ createdAt: -1 }).limit(5),
  ]);

  res.status(200).json({
    status: "success",
    data: {
      recentUsers: recentUsers.map((u) => ({
        id: String(u._id),
        name: u.name,
        mobile: u.mobile,
        role: u.role,
        city: u.city,
        joinedAt: u.createdAt,
      })),
      recentLawyerApplications: recentApplications.map((p) => ({
        id: String(p._id),
        name: p.user ? p.user.name : null,
        practiceArea: p.practiceArea,
        status: p.approvalStatus,
        appliedAt: p.createdAt,
      })),
    },
  });
});
