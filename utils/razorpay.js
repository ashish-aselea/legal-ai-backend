const Razorpay = require("razorpay");
const { AppError } = require("../middleware/errorHandler");
const { PaymentSettings, SINGLETON_ID } = require("../models/PaymentSettings");

// Credentials live in the DB (admin-set from the Settings page), not .env —
// built fresh each call so a credential rotation takes effect immediately,
// with no server restart needed.
const getRazorpayClient = async () => {
  const settings = await PaymentSettings.findById(SINGLETON_ID).select("+razorpayKeySecret");

  if (!settings?.razorpayKeyId || !settings?.razorpayKeySecret) {
    throw new AppError("Payment gateway is not configured yet. Contact the admin.", 503);
  }

  return {
    client: new Razorpay({ key_id: settings.razorpayKeyId, key_secret: settings.razorpayKeySecret }),
    keyId: settings.razorpayKeyId,
    keySecret: settings.razorpayKeySecret,
  };
};

module.exports = { getRazorpayClient };
