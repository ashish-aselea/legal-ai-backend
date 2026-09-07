const { z } = require("zod");

const createPracticeAreaSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
});

const updatePracticeAreaSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(50).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update: name or isActive",
  });

module.exports = { createPracticeAreaSchema, updatePracticeAreaSchema };
