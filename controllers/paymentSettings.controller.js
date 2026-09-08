const { asyncHandler } = require("../utils/asyncHandler");
const { PaymentSettings, SINGLETON_ID } = require("../models/PaymentSettings");

// GET /api/v1/admin/settings/payment
exports.getPaymentSettings = asyncHandler(async (req, res) => {
  const doc = await PaymentSettings.findById(SINGLETON_ID).select("+razorpayKeySecret");

  res.status(200).json({
    status: "success",
    data: {
      settings: {
        razorpayKeyId: doc?.razorpayKeyId || null,
        isRazorpayKeySecretSet: !!doc?.razorpayKeySecret,
      },
    },
  });
});

// PATCH /api/v1/admin/settings/payment
// Either field is optional so admin can rotate just the secret, or just the
// key id, without needing to resend the other.
exports.updatePaymentSettings = asyncHandler(async (req, res) => {
  const { razorpayKeyId, razorpayKeySecret } = req.body;

  const doc = await PaymentSettings.findByIdAndUpdate(
    SINGLETON_ID,
    {
      $set: {
        ...(razorpayKeyId !== undefined && { razorpayKeyId }),
        ...(razorpayKeySecret !== undefined && { razorpayKeySecret }),
        updatedBy: req.user.id,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).select("+razorpayKeySecret");

  res.status(200).json({
    status: "success",
    message: "Payment settings updated",
    data: {
      settings: {
        razorpayKeyId: doc.razorpayKeyId || null,
        isRazorpayKeySecretSet: !!doc.razorpayKeySecret,
      },
    },
  });
});
