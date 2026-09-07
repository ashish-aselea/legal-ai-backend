const { z } = require("zod");

const blockUserSchema = z.object({
  reason: z.string().trim().min(3, "Reason must be at least 3 characters").optional(),
});

module.exports = { blockUserSchema };
