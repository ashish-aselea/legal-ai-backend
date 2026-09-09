const crypto = require("crypto");
const { AppError } = require("../middleware/errorHandler");
const { asyncHandler } = require("../utils/asyncHandler");
const { LawyerProfile, APPROVAL_STATUS } = require("../models/LawyerProfile");
const { Booking, BOOKING_STATUS, PAYMENT_METHODS } = require("../models/Booking");
const { dayAbbrForDate } = require("../utils/dayOfWeek");
const { getRazorpayClient } = require("../utils/razorpay");
const { debitWallet } = require("../utils/walletLedger");

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
  paymentMethod: booking.paymentMethod,
  status: booking.status,
  createdAt: booking.createdAt,
});

const today = () => new Date().toISOString().slice(0, 10);

// POST /api/v1/bookings
exports.createBooking = asyncHandler(async (req, res) => {
  const { lawyerId, consultationType, date, timeSlot, paymentMethod } = req.body;

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
  if (!profile.availableDays.includes(dayAbbrForDate(date))) {
    throw new AppError("This lawyer is not available on the selected day", 400);
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

  // Wallet path: check upfront, before ever creating a booking or holding
  // the slot — no external API call needed to know the outcome, unlike Razorpay.
  if (paymentMethod === PAYMENT_METHODS.WALLET) {
    const debited = await debitWallet(req.user.id, profile.pricePerSession);
    if (!debited.success) {
      throw new AppError("Insufficient wallet balance for this booking", 400);
    }

    let booking;
    try {
      // Re-check the slot right before booking — a concurrent request could
      // have taken it in between, and unlike the Razorpay path, money has
      // already left the wallet here, so a refund-on-failure path matters.
      const stillFree = !(await Booking.findOne({
        lawyer: profile._id,
        date,
        timeSlot,
        status: { $in: [BOOKING_STATUS.PENDING_PAYMENT, BOOKING_STATUS.CONFIRMED] },
      }));
      if (!stillFree) throw new AppError("This time slot is already booked, please pick another", 409);

      booking = await Booking.create({
        user: req.user.id,
        lawyer: profile._id,
        consultationType,
        date,
        timeSlot,
        amount: profile.pricePerSession,
        paymentMethod,
        status: BOOKING_STATUS.CONFIRMED, // wallet debit IS the payment — no further step needed
      });
    } catch (err) {
      await debitWallet(req.user.id, -profile.pricePerSession); // refund
      throw err;
    }

    await LawyerProfile.updateOne({ _id: profile._id }, { $inc: { consultsCount: 1 } });
    await booking.populate({ path: "lawyer", populate: { path: "user", select: "name" } });

    return res.status(201).json({
      status: "success",
      message: "Payment successful, your consultation is confirmed",
      data: { booking: buildBookingResponse(booking), payment: null },
    });
  }

  // Razorpay path: create the booking (pending_payment) and its order in the
  // same call. If order creation fails (gateway not configured, Razorpay
  // hiccup), undo the booking too — otherwise it'd sit in pending_payment
  // forever with no way to ever get an order for it, permanently holding the slot.
  const booking = await Booking.create({
    user: req.user.id,
    lawyer: profile._id,
    consultationType,
    date,
    timeSlot,
    amount: profile.pricePerSession,
    paymentMethod,
  });
  await LawyerProfile.updateOne({ _id: profile._id }, { $inc: { consultsCount: 1 } });

  let keyId, order;
  try {
    const rzp = await getRazorpayClient();
    keyId = rzp.keyId;
    order = await rzp.client.orders.create({
      amount: booking.amount * 100,
      currency: "INR",
      receipt: `booking_${booking._id}`,
    });
  } catch (err) {
    await Booking.deleteOne({ _id: booking._id });
    await LawyerProfile.updateOne({ _id: profile._id }, { $inc: { consultsCount: -1 } });
    throw err;
  }
  booking.razorpayOrderId = order.id;
  await booking.save();

  res.status(201).json({
    status: "success",
    message: "Booking created. Complete the payment to confirm it.",
    data: {
      booking: buildBookingResponse(booking),
      payment: { orderId: order.id, amount: booking.amount, currency: "INR", keyId },
    },
  });
});

// PATCH /api/v1/bookings/:id/confirm-payment
// Step 2: the app calls this after Razorpay Checkout completes. We verify
// the signature ourselves — never trust the client's word that it paid —
// same HMAC check as the wallet recharge flow.
exports.confirmPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

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
  if (!booking.razorpayOrderId) {
    throw new AppError("No payment order exists for this booking yet — call create-order first", 400);
  }
  if (booking.razorpayOrderId !== razorpay_order_id) {
    throw new AppError("razorpay_order_id does not match this booking's order", 400);
  }

  const { keySecret } = await getRazorpayClient();

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    booking.razorpayPaymentId = razorpay_payment_id;
    await booking.save();
    throw new AppError("Payment verification failed — signature mismatch", 400);
  }

  booking.status = BOOKING_STATUS.CONFIRMED;
  booking.razorpayPaymentId = razorpay_payment_id;
  booking.razorpaySignature = razorpay_signature;
  await booking.save();

  await booking.populate({ path: "lawyer", populate: { path: "user", select: "name" } });

  res.status(200).json({
    status: "success",
    message: "Payment successful, your consultation is confirmed",
    data: { booking: buildBookingResponse(booking) },
  });
});
