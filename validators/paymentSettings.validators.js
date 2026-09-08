const { z } = require("zod");

const updatePaymentSettingsSchema = z
  .object({
    razorpayKeyId: z.string().trim().min(1, "razorpayKeyId cannot be empty").optional(),
    razorpayKeySecret: z.string().trim().min(1, "razorpayKeySecret cannot be empty").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update: razorpayKeyId or razorpayKeySecret",
  });

module.exports = { updatePaymentSettingsSchema };
