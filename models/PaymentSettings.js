const mongoose = require("mongoose");

// A single fixed document (_id is always this literal string) — there is only
// ever one payment-gateway config, so no "list"/"create" endpoints, just get/update.
const SINGLETON_ID = "payment-settings";

const paymentSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: SINGLETON_ID },
    razorpayKeyId: { type: String, trim: true, default: null },
    // Never returned by any GET response — write-only from the API's point of
    // view. Controllers must only ever send back whether it's set, not its value.
    razorpayKeySecret: { type: String, trim: true, default: null, select: false },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const PaymentSettings = mongoose.model("PaymentSettings", paymentSettingsSchema);

module.exports = { PaymentSettings, SINGLETON_ID };
