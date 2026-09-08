const { z } = require("zod");

const createWalletAmountSchema = z.object({
  amount: z.coerce.number().int().positive("amount must be a positive whole number"),
});

const updateWalletAmountSchema = z
  .object({
    amount: z.coerce.number().int().positive("amount must be a positive whole number").optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update: amount or isActive",
  });

module.exports = { createWalletAmountSchema, updateWalletAmountSchema };
