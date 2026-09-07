const { z } = require("zod");

const updateWorkingHoursSchema = z.object({
  startTime: z.string().trim().min(1, "startTime is required"),
  endTime: z.string().trim().min(1, "endTime is required"),
});

module.exports = { updateWorkingHoursSchema };
