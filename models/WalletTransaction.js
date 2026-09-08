const mongoose = require("mongoose");

const TRANSACTION_STATUS = {
  CREATED: "created", // Razorpay order created, payment not attempted/completed yet
  PAID: "paid", // signature verified, wallet credited
  FAILED: "failed", // signature verification failed
};

const walletTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: Object.values(TRANSACTION_STATUS),
      default: TRANSACTION_STATUS.CREATED,
      index: true,
    },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
  },
  { timestamps: true }
);

const WalletTransaction = mongoose.model("WalletTransaction", walletTransactionSchema);

module.exports = { WalletTransaction, TRANSACTION_STATUS };
