const express = require("express");
const authController = require("../controllers/auth.controller");
const { validateBody } = require("../middleware/validate");
const { authenticate, authenticateRegistration } = require("../middleware/auth");
const { uploadSinglePhoto } = require("../middleware/upload");
const {
  sendOtpSchema,
  verifyOtpSchema,
  userSignupSchema,
  lawyerSignupSchema,
  updateProfileSchema,
} = require("../validators/auth.validators");

const router = express.Router();

router.post("/send-otp", validateBody(sendOtpSchema), authController.sendOtp);
router.post("/verify-otp", validateBody(verifyOtpSchema), authController.verifyOtp);

router.post(
  "/signup/user",
  authenticateRegistration,
  validateBody(userSignupSchema),
  authController.signupUser
);
router.post(
  "/signup/lawyer",
  authenticateRegistration,
  validateBody(lawyerSignupSchema),
  authController.signupLawyer
);

router.get("/me", authenticate, authController.getMe);
router.patch("/me", authenticate, validateBody(updateProfileSchema), authController.updateMe);
router.patch("/me/photo", authenticate, uploadSinglePhoto, authController.uploadProfilePhoto);
router.post("/logout", authenticate, authController.logout);

module.exports = router;
