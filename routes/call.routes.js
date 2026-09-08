const express = require("express");
const callController = require("../controllers/call.controller");
const { authenticate } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { canStartCallSchema, registerCallSchema } = require("../validators/call.validators");

const router = express.Router();

// Public — ZEGOCLOUD's own server calls this, authenticated by signature, not a user JWT.
router.post("/zego-webhook", callController.zegoWebhook);

router.post("/can-start", authenticate, validateBody(canStartCallSchema), callController.canStartCall);
router.post("/zego-token", authenticate, callController.getZegoToken);
router.post("/register", authenticate, validateBody(registerCallSchema), callController.registerCall);
router.get("/tick/:callSessionId", authenticate, callController.getCallTick);

module.exports = router;
