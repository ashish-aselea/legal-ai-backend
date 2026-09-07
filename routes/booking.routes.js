const express = require("express");
const bookingController = require("../controllers/booking.controller");
const { authenticate } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { createBookingSchema } = require("../validators/booking.validators");

const router = express.Router();

router.post(
  "/",
  authenticate,
  validateBody(createBookingSchema),
  bookingController.createBooking
);

router.patch("/:id/confirm-payment", authenticate, bookingController.confirmPayment);

module.exports = router;
