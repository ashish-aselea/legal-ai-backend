const { z } = require("zod");
const { CONSULTATION_TYPES, TIME_SLOTS } = require("../models/Booking");

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

const availabilityQuerySchema = z.object({ date: isoDate });

const createBookingSchema = z.object({
  lawyerId: z.string().trim().regex(/^[0-9a-fA-F]{24}$/, "Invalid lawyerId"),
  consultationType: z.enum(Object.values(CONSULTATION_TYPES)),
  date: isoDate,
  timeSlot: z.enum(TIME_SLOTS),
});

module.exports = { availabilityQuerySchema, createBookingSchema };
