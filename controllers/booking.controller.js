const { AppError } = require("../middleware/errorHandler");
const { asyncHandler } = require("../utils/asyncHandler");
const { LawyerProfile, APPROVAL_STATUS } = require("../models/LawyerProfile");
const { Booking, BOOKING_STATUS } = require("../models/Booking");

const buildBookingResponse = (booking) => ({
  id: String(booking._id),
  lawyer: booking.lawyer.user
    ? {
        id: String(booking.lawyer._id),
        name: booking.lawyer.user.name,
        practiceArea: booking.lawyer.practiceArea,
      }
    : String(booking.lawyer),
  consultationType: booking.consultationType,
  date: booking.date,
  timeSlot: booking.timeSlot,
  amount: booking.amount,
  status: booking.status,
  createdAt: booking.createdAt,
});

const today = () => new Date().toISOString().slice(0, 10);

// POST /api/v1/bookings
exports.createBooking = asyncHandler(async (req, res) => {
  const { lawyerId, consultationType, date, timeSlot } = req.body;

  if (date < today()) {
    throw new AppError("Cannot book a consultation for a past date", 400);
  }

  const profile = await LawyerProfile.findOne({
    _id: lawyerId,
    approvalStatus: APPROVAL_STATUS.APPROVED,
  });

  if (!profile) {
    throw new AppError("Lawyer not found", 404);
  }
  if (profile.pricePerSession === null) {
    throw new AppError("This lawyer has not set a consultation price yet", 400);
  }
  if (!profile.supportedConsultationTypes.includes(consultationType)) {
    throw new AppError(`This lawyer does not currently offer ${consultationType} consultations`, 400);
  }

  const slotTaken = await Booking.findOne({
    lawyer: profile._id,
    date,
    timeSlot,
    status: { $in: [BOOKING_STATUS.PENDING_PAYMENT, BOOKING_STATUS.CONFIRMED] },
  });

  if (slotTaken) {
    throw new AppError("This time slot is already booked, please pick another", 409);
  }

  const booking = await Booking.create({
    user: req.user.id,
    lawyer: profile._id,
    consultationType,
    date,
    timeSlot,
    amount: profile.pricePerSession,
  });

  await LawyerProfile.updateOne({ _id: profile._id }, { $inc: { consultsCount: 1 } });

  res.status(201).json({
    status: "success",
    message: "Booking created. Complete the payment to confirm it.",
    data: { booking: buildBookingResponse(booking) },
  });
});

// PATCH /api/v1/bookings/:id/confirm-payment
// Stands in for the payment gateway callback until a real gateway is integrated.
exports.confirmPayment = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user.id });

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }
  if (booking.status === BOOKING_STATUS.CONFIRMED) {
    throw new AppError("This booking is already confirmed", 400);
  }
  if (booking.status === BOOKING_STATUS.CANCELLED) {
    throw new AppError("This booking was cancelled and cannot be paid for", 400);
  }

  booking.status = BOOKING_STATUS.CONFIRMED;
  await booking.save();

  await booking.populate({ path: "lawyer", populate: { path: "user", select: "name" } });

  res.status(200).json({
    status: "success",
    message: "Payment successful, your consultation is confirmed",
    data: { booking: buildBookingResponse(booking) },
  });
});
