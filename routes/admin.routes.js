const express = require("express");
const adminController = require("../controllers/admin.controller");
const practiceAreaController = require("../controllers/practiceArea.controller");
const dashboardController = require("../controllers/dashboard.controller");
const workingHoursController = require("../controllers/workingHours.controller");
const walletAmountController = require("../controllers/walletAmount.controller");
const paymentSettingsController = require("../controllers/paymentSettings.controller");
const { authenticate, requireRole } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { rejectLawyerSchema } = require("../validators/auth.validators");
const {
  createPracticeAreaSchema,
  updatePracticeAreaSchema,
} = require("../validators/practiceArea.validators");
const { blockUserSchema } = require("../validators/user.validators");
const { updateWorkingHoursSchema } = require("../validators/workingHours.validators");
const {
  createWalletAmountSchema,
  updateWalletAmountSchema,
} = require("../validators/walletAmount.validators");
const { updatePaymentSettingsSchema } = require("../validators/paymentSettings.validators");
const { USER_ROLES } = require("../models/User");

const router = express.Router();

// Every admin route needs a logged-in admin.
router.use(authenticate, requireRole(USER_ROLES.ADMIN));

router.get("/lawyers", adminController.listLawyers);
router.patch("/lawyers/:id/approve", adminController.approveLawyer);
router.patch(
  "/lawyers/:id/reject",
  validateBody(rejectLawyerSchema),
  adminController.rejectLawyer
);

router.get("/practice-areas", practiceAreaController.listAllPracticeAreas);
router.post(
  "/practice-areas",
  validateBody(createPracticeAreaSchema),
  practiceAreaController.createPracticeArea
);
router.patch(
  "/practice-areas/:id",
  validateBody(updatePracticeAreaSchema),
  practiceAreaController.updatePracticeArea
);

router.get("/dashboard/stats", dashboardController.getDashboardStats);
router.get("/dashboard/user-growth", dashboardController.getUserGrowth);
router.get("/dashboard/recent", dashboardController.getRecentActivity);

router.get("/users", adminController.listUsers);
router.patch("/users/:id/block", validateBody(blockUserSchema), adminController.blockUser);
router.patch("/users/:id/unblock", adminController.unblockUser);

router.get("/consultations", adminController.listConsultations);

router.get("/working-hours", workingHoursController.listWorkingHours);
router.patch(
  "/working-hours/:day",
  validateBody(updateWorkingHoursSchema),
  workingHoursController.updateWorkingHours
);

router.get("/wallet/preset-amounts", walletAmountController.listAllWalletAmounts);
router.post(
  "/wallet/preset-amounts",
  validateBody(createWalletAmountSchema),
  walletAmountController.createWalletAmount
);
router.patch(
  "/wallet/preset-amounts/:id",
  validateBody(updateWalletAmountSchema),
  walletAmountController.updateWalletAmount
);

router.get("/settings/payment", paymentSettingsController.getPaymentSettings);
router.patch(
  "/settings/payment",
  validateBody(updatePaymentSettingsSchema),
  paymentSettingsController.updatePaymentSettings
);

module.exports = router;
