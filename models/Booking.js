const mongoose = require("mongoose");

const CONSULTATION_TYPES = {
  CHAT: "Chat",
  AUDIO: "Audio",
  VIDEO: "Video",
};

// Fixed slots offered by every lawyer each day. A slot disappears from the
// availability list once someone holds it (pending payment) or has paid for it.
const TIME_SLOTS = ["10:00 AM", "11:30 AM", "2:00 PM", "4:30 PM"];

const BOOKING_STATUS = {
  PENDING_PAYMENT: "pending_payment",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
};

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    lawyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LawyerProfile",
      required: true,
      index: true,
    },
    consultationType: {
      type: String,
      enum: Object.values(CONSULTATION_TYPES),
      required: true,
    },
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"],
    },
    timeSlot: { type: String, enum: TIME_SLOTS, required: true },
    // Copied from the lawyer's price at booking time so later price changes
    // do not rewrite what this user was charged.
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING_PAYMENT,
      index: true,
    },
    // Set by POST /bookings/:id/create-order, then filled in as the payment
    // completes and gets verified — same pattern as WalletTransaction.
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
  },
  { timestamps: true }
);

bookingSchema.index({ lawyer: 1, date: 1, timeSlot: 1 });

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = { Booking, CONSULTATION_TYPES, TIME_SLOTS, BOOKING_STATUS };
