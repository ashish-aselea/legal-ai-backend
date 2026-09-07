const { z } = require("zod");
const { AVAILABILITY_STATUS, DAYS_OF_WEEK } = require("../models/LawyerProfile");

const listLawyersQuerySchema = z.object({
  practiceArea: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
});

const updateMyLawyerProfileSchema = z
  .object({
    // User-level fields — updated on the User document, everything else on LawyerProfile.
    // Kept in this one schema so the whole "Edit Profile" screen is a single API call.
    name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
    email: z.string().trim().toLowerCase().email("Invalid email address").optional(),
    pricePerSession: z.coerce.number().positive("pricePerSession must be greater than 0").optional(),
    callFeePerMinute: z.coerce
      .number()
      .positive("callFeePerMinute must be greater than 0")
      .optional(),
    availabilityStatus: z.enum(Object.values(AVAILABILITY_STATUS)).optional(),
    bio: z.string().trim().max(2000, "Bio must be 2000 characters or less").optional(),
    specializations: z
      .array(z.string().trim().min(2, "Each specialization must be at least 2 characters"))
      .max(8, "At most 8 specializations")
      .optional(),
    languages: z
      .array(z.string().trim().min(2, "Each language must be at least 2 characters"))
      .max(8, "At most 8 languages")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message:
      "Provide at least one field to update: name, email, pricePerSession, callFeePerMinute, availabilityStatus, bio, specializations or languages",
  });

const updateConsultationTypeSchema = z.object({
  available: z.boolean(),
});

const updatePricePerSessionSchema = z.object({
  pricePerSession: z.coerce.number().positive("pricePerSession must be greater than 0"),
});

const updateCallFeePerMinuteSchema = z.object({
  callFeePerMinute: z.coerce.number().positive("callFeePerMinute must be greater than 0"),
});

// Empty array is allowed on purpose — a lawyer going fully on leave for a
// while is a real case, not a mistake.
const updateAvailableDaysSchema = z.object({
  availableDays: z.array(z.enum(DAYS_OF_WEEK)).max(7, "At most 7 days"),
});

module.exports = {
  listLawyersQuerySchema,
  updateMyLawyerProfileSchema,
  updateConsultationTypeSchema,
  updatePricePerSessionSchema,
  updateCallFeePerMinuteSchema,
  updateAvailableDaysSchema,
};
