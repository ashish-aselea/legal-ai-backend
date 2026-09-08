const crypto = require("crypto");
const { AppError } = require("../middleware/errorHandler");
const { asyncHandler } = require("../utils/asyncHandler");
const { User } = require("../models/User");
const { WalletTransaction, TRANSACTION_STATUS } = require("../models/WalletTransaction");
const { getRazorpayClient } = require("../utils/razorpay");
const { PaymentSettings, SINGLETON_ID } = require("../models/PaymentSettings");

// GET /api/v1/wallet/payment-config
// Public — lets the app fetch the Razorpay key id (never the secret) up
// front, e.g. to initialize the Checkout SDK or grey out "Add Money" before
// the user even picks an amount, without needing to create an order first.
exports.getPaymentConfig = asyncHandler(async (req, res) => {
  const settings = await PaymentSettings.findById(SINGLETON_ID);

  res.status(200).json({
    status: "success",
    data: {
      razorpayKeyId: settings?.razorpayKeyId || null,
      isPaymentGatewayConfigured: !!settings?.razorpayKeyId,
    },
  });
});

// GET /api/v1/wallet
exports.getWallet = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("walletBalance");

  res.status(200).json({
    status: "success",
    data: { balance: user.walletBalance },
  });
});

// POST /api/v1/wallet/recharge/create-order
// Step 1 of the recharge flow: create a Razorpay order server-side, hand the
// app just enough (order id + the public key id) to open Razorpay Checkout.
exports.createRechargeOrder = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const { client, keyId } = await getRazorpayClient();

  // Razorpay takes amount in paise, and every order needs a short unique
  // receipt string — using our own transaction id keeps the two linked.
  const order = await client.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: `wallet_${req.user.id}_${Date.now()}`,
  });

  await WalletTransaction.create({
    user: req.user.id,
    amount,
    razorpayOrderId: order.id,
    status: TRANSACTION_STATUS.CREATED,
  });

  res.status(201).json({
    status: "success",
    data: {
      orderId: order.id,
      amount,
      currency: "INR",
      keyId,
    },
  });
});

// POST /api/v1/wallet/recharge/verify
// Step 2: the app calls this after Razorpay Checkout completes, handing back
// the three values Razorpay gave it. We verify the signature ourselves —
// never trust the client's word that a payment succeeded.
exports.verifyRechargePayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const transaction = await WalletTransaction.findOne({
    razorpayOrderId: razorpay_order_id,
    user: req.user.id,
  });

  if (!transaction) {
    throw new AppError("No matching recharge order found for this user", 404);
  }
  if (transaction.status === TRANSACTION_STATUS.PAID) {
    throw new AppError("This payment has already been verified and credited", 409);
  }

  const { keySecret } = await getRazorpayClient();

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    transaction.status = TRANSACTION_STATUS.FAILED;
    transaction.razorpayPaymentId = razorpay_payment_id;
    await transaction.save();
    throw new AppError("Payment verification failed — signature mismatch", 400);
  }

  transaction.status = TRANSACTION_STATUS.PAID;
  transaction.razorpayPaymentId = razorpay_payment_id;
  transaction.razorpaySignature = razorpay_signature;
  await transaction.save();

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $inc: { walletBalance: transaction.amount } },
    { new: true }
  ).select("walletBalance");

  res.status(200).json({
    status: "success",
    message: "Payment verified, wallet credited",
    data: { balance: user.walletBalance, creditedAmount: transaction.amount },
  });
});
