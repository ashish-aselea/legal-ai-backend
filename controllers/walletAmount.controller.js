const { AppError } = require("../middleware/errorHandler");
const { asyncHandler } = require("../utils/asyncHandler");
const { WalletPresetAmount } = require("../models/WalletPresetAmount");

const buildResponse = (doc) => ({
  id: String(doc._id),
  amount: doc.amount,
  isActive: doc.isActive,
});

// GET /api/v1/wallet/preset-amounts
// Public — powers the quick-select buttons on the "My Wallet" add-money screen.
exports.listActiveWalletAmounts = asyncHandler(async (req, res) => {
  const amounts = await WalletPresetAmount.find({ isActive: true }).sort({ amount: 1 });

  res.status(200).json({
    status: "success",
    results: amounts.length,
    data: { presetAmounts: amounts.map((a) => a.amount) },
  });
});

// GET /api/v1/admin/wallet/preset-amounts
// Admin — includes inactive ones so they can be reactivated.
exports.listAllWalletAmounts = asyncHandler(async (req, res) => {
  const amounts = await WalletPresetAmount.find().sort({ amount: 1 });

  res.status(200).json({
    status: "success",
    results: amounts.length,
    data: { presetAmounts: amounts.map(buildResponse) },
  });
});

// POST /api/v1/admin/wallet/preset-amounts
exports.createWalletAmount = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  const existing = await WalletPresetAmount.findOne({ amount });
  if (existing) {
    throw new AppError("This amount already exists", 409);
  }

  const doc = await WalletPresetAmount.create({ amount });

  res.status(201).json({
    status: "success",
    message: "Preset amount added",
    data: { presetAmount: buildResponse(doc) },
  });
});

// PATCH /api/v1/admin/wallet/preset-amounts/:id
// Used to change the value, or to activate/deactivate (soft delete) an amount.
exports.updateWalletAmount = asyncHandler(async (req, res) => {
  if (req.body.amount !== undefined) {
    const existing = await WalletPresetAmount.findOne({
      amount: req.body.amount,
      _id: { $ne: req.params.id },
    });
    if (existing) {
      throw new AppError("This amount already exists", 409);
    }
  }

  const doc = await WalletPresetAmount.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });

  if (!doc) {
    throw new AppError("Preset amount not found", 404);
  }

  res.status(200).json({
    status: "success",
    message: "Preset amount updated",
    data: { presetAmount: buildResponse(doc) },
  });
});
