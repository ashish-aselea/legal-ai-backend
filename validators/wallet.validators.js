const { z } = require("zod");

const createRechargeOrderSchema = z.object({
  amount: z.coerce.number().int().positive("amount must be a positive whole number"),
});

const verifyRechargePaymentSchema = z.object({
  razorpay_order_id: z.string().trim().min(1, "razorpay_order_id is required"),
  razorpay_payment_id: z.string().trim().min(1, "razorpay_payment_id is required"),
  razorpay_signature: z.string().trim().min(1, "razorpay_signature is required"),
});

module.exports = { createRechargeOrderSchema, verifyRechargePaymentSchema };
