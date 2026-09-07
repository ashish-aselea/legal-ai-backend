const { z } = require("zod");
const { LAWYER_TYPES } = require("../models/LawyerProfile");

const mobile = z
  .string()
  .trim()
  .regex(/^\d{10}$/, "Mobile number must be exactly 10 digits");

const sendOtpSchema = z.object({ mobile });

const verifyOtpSchema = z.object({
  mobile,
  otp: z
    .string()
    .trim()
    .regex(/^\d{4,6}$/, "OTP must be 4 to 6 digits"),
});

const userSignupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  city: z.string().trim().min(2, "City is required"),
});

const lawyerSignupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  iAmA: z.enum(Object.values(LAWYER_TYPES)),
  barCouncilEnrollmentNumber: z
    .string()
    .trim()
    .min(3, "Bar Council enrollment number is required"),
  // Not a fixed enum: checked against the active PracticeArea list in the controller.
  practiceArea: z.string().trim().min(2, "Practice area is required"),
  yearsOfExperience: z.coerce
    .number()
    .int("Years of experience must be a whole number")
    .min(0)
    .max(70),
  cityJurisdiction: z.string().trim().min(2, "City / jurisdiction is required"),
});

const rejectLawyerSchema = z.object({
  rejectionReason: z.string().trim().min(3, "Rejection reason is required"),
});

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
    email: z.string().trim().toLowerCase().email("Invalid email address").optional(),
    city: z.string().trim().min(2, "City is required").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update: name, email or city",
  });

module.exports = {
  sendOtpSchema,
  verifyOtpSchema,
  userSignupSchema,
  lawyerSignupSchema,
  rejectLawyerSchema,
  updateProfileSchema,
};
