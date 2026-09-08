const express = require("express");
const walletAmountController = require("../controllers/walletAmount.controller");
const walletController = require("../controllers/wallet.controller");
const { authenticate } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const {
  createRechargeOrderSchema,
  verifyRechargePaymentSchema,
} = require("../validators/wallet.validators");

const router = express.Router();

router.get("/preset-amounts", walletAmountController.listActiveWalletAmounts);
router.get("/payment-config", walletController.getPaymentConfig);

router.get("/", authenticate, walletController.getWallet);
router.post(
  "/recharge/create-order",
  authenticate,
  validateBody(createRechargeOrderSchema),
  walletController.createRechargeOrder
);
router.post(
  "/recharge/verify",
  authenticate,
  validateBody(verifyRechargePaymentSchema),
  walletController.verifyRechargePayment
);

module.exports = router;
