const mongoose = require("mongoose");

const USER_ROLES = {
  USER: "user",
  LAWYER: "lawyer",
  ADMIN: "admin",
};

const userSchema = new mongoose.Schema(
  {
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\d{10}$/, "Mobile number must be exactly 10 digits"],
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
    },
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    city: { type: String, trim: true },
    isProfileComplete: { type: Boolean, default: false },
    profilePhotoUrl: { type: String, default: null },
    profilePhotoPublicId: { type: String, default: null, select: false },
    // Credited only via a verified Razorpay recharge — see WalletTransaction.
    walletBalance: { type: Number, default: 0, min: 0 },
    isBlocked: { type: Boolean, default: false, index: true },
    blockedReason: { type: String, trim: true, default: null },
    blockedAt: { type: Date, default: null },
    blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = { User, USER_ROLES };
