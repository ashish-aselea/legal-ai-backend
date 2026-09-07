const express = require("express");
const lawyerController = require("../controllers/lawyer.controller");
const { authenticate, requireRole } = require("../middleware/auth");
const { validateBody, validateQuery } = require("../middleware/validate");
const {
  listLawyersQuerySchema,
  updateMyLawyerProfileSchema,
  updateConsultationTypeSchema,
  updatePricePerSessionSchema,
  updateCallFeePerMinuteSchema,
  updateAvailableDaysSchema,
} = require("../validators/lawyer.validators");
const { availabilityQuerySchema } = require("../validators/booking.validators");
const { USER_ROLES } = require("../models/User");

const router = express.Router();

// Public — "Find a lawyer" home screen
router.get("/", validateQuery(listLawyersQuerySchema), lawyerController.listLawyers);

router.patch(
  "/me",
  authenticate,
  requireRole(USER_ROLES.LAWYER),
  validateBody(updateMyLawyerProfileSchema),
  lawyerController.updateMyLawyerProfile
);

router.patch(
  "/me/consultation-types/:type",
  authenticate,
  requireRole(USER_ROLES.LAWYER),
  validateBody(updateConsultationTypeSchema),
  lawyerController.updateConsultationTypeAvailability
);

router.patch(
  "/me/consultation-fee",
  authenticate,
  requireRole(USER_ROLES.LAWYER),
  validateBody(updatePricePerSessionSchema),
  lawyerController.updatePricePerSession
);

router.patch(
  "/me/call-fee-per-minute",
  authenticate,
  requireRole(USER_ROLES.LAWYER),
  validateBody(updateCallFeePerMinuteSchema),
  lawyerController.updateCallFeePerMinute
);

router.get(
  "/me/weekly-availability",
  authenticate,
  requireRole(USER_ROLES.LAWYER),
  lawyerController.getMyWeeklyAvailability
);

router.patch(
  "/me/weekly-availability",
  authenticate,
  requireRole(USER_ROLES.LAWYER),
  validateBody(updateAvailableDaysSchema),
  lawyerController.updateMyWeeklyAvailability
);

router.get("/:id", lawyerController.getLawyerById);
router.get("/:id/reviews", lawyerController.getLawyerReviews);
router.get(
  "/:id/availability",
  validateQuery(availabilityQuerySchema),
  lawyerController.getLawyerAvailability
);

module.exports = router;
