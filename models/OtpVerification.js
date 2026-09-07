const mongoose = require("mongoose");

const otpVerificationSchema = new mongoose.Schema(
  {
    mobile: { type: String, required: true, index: true, trim: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Mongo removes the document automatically once expiresAt passes.
otpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OtpVerification = mongoose.model("OtpVerification", otpVerificationSchema);

module.exports = { OtpVerification };
