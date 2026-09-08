const mongoose = require("mongoose");

// Admin-managed quick-select amounts shown on the "My Wallet" add-money screen
// (₹10, ₹50, ₹100, ...). Same soft-delete pattern as PracticeArea.
const walletPresetAmountSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, unique: true, min: 1 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

const WalletPresetAmount = mongoose.model("WalletPresetAmount", walletPresetAmountSchema);

module.exports = { WalletPresetAmount };
