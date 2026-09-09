const { AppError } = require("../middleware/errorHandler");
const { asyncHandler } = require("../utils/asyncHandler");
const { User } = require("../models/User");
const { LawyerProfile, APPROVAL_STATUS } = require("../models/LawyerProfile");
const { CallSession, CALL_STATUS } = require("../models/CallSession");
const { generateZegoToken04 } = require("../utils/zegoToken");
const { verifyZegoWebhookSignature } = require("../utils/zegoWebhook");
const { env } = require("../config/env");

const TOKEN_TTL_SECONDS = 3600;
const PENDING_RING_TIMEOUT_MS = 3 * 60 * 1000; // no room_create within this = treat as unanswered
const STALE_ONGOING_CEILING_MS = 4 * 60 * 60 * 1000; // webhook never arrived to end it
//ca
// callSessionId (string) -> Node interval handle. In-memory by design — a call
// only lasts minutes, and a server restart mid-call is already handled by the
// stale-call reaper settling it from the DB once it notices no more webhooks.
const activeBillingLoops = new Map();

const stopBillingLoop = (callSessionId) => {
  const handle = activeBillingLoops.get(String(callSessionId));
  if (handle) {
    clearInterval(handle);
    activeBillingLoops.delete(String(callSessionId));
  }
};

// Atomic conditional decrement — never lets a call push a balance negative,
// and safe under concurrent calls to the same wallet.
const debitWallet = async (userId, amount) => {
  const user = await User.findOneAndUpdate(
    { _id: userId, walletBalance: { $gte: amount } },
    { $inc: { walletBalance: -amount } },
    { new: true }
  );
  return { success: !!user, balance: user ? user.walletBalance : null };
};

const getWalletBalance = async (userId) => {
  const user = await User.findById(userId).select("walletBalance");
  return user ? user.walletBalance : 0;
};

// Shared by /calls/can-start and /calls/register — same checks, run twice
// because time passes between the two calls and either could have changed.
const checkCallAllowed = async (callerId, lawyerId, mode) => {
  const lawyer = await LawyerProfile.findOne({
    _id: lawyerId,
    approvalStatus: APPROVAL_STATUS.APPROVED,
  }).populate("user", "isBlocked");

  if (!lawyer || lawyer.user?.isBlocked) {
    return { allowed: false, reason: "lawyer_not_found", message: "Lawyer not found" };
  }
  if (!lawyer.supportedConsultationTypes?.includes(mode === "video" ? "Video" : "Audio")) {
    return { allowed: false, reason: "mode_not_supported", message: `This lawyer does not offer ${mode} calls` };
  }
  if (lawyer.callFeePerMinute === null || lawyer.callFeePerMinute === undefined) {
    return { allowed: false, reason: "no_call_rate_set", message: "This lawyer has not set a call rate yet" };
  }

  const busy = await CallSession.findOne({
    lawyer: lawyerId,
    status: { $in: [CALL_STATUS.PENDING, CALL_STATUS.ONGOING] },
  });
  if (busy) {
    return { allowed: false, reason: "lawyer_busy", message: "This lawyer is currently on another call" };
  }

  const balance = await getWalletBalance(callerId);
  if (balance < lawyer.callFeePerMinute) {
    return {
      allowed: false,
      reason: "insufficient_balance",
      message: "Insufficient balance for at least one minute of this call.",
    };
  }

  return { allowed: true, callFeePerMinute: lawyer.callFeePerMinute };
};

// POST /api/v1/calls/can-start
exports.canStartCall = asyncHandler(async (req, res) => {
  const { lawyerId, mode } = req.body;
  const result = await checkCallAllowed(req.user.id, lawyerId, mode);
  console.log(`[can-start] caller=${req.user.id} lawyerId=${lawyerId} mode=${mode} -> ${JSON.stringify(result)}`);

  res.status(200).json({ status: "success", data: result });
});

// POST /api/v1/calls/zego-token
exports.getZegoToken = asyncHandler(async (req, res) => {
  if (!env.zegoServerSecret) {
    throw new AppError("Calling is not configured yet. Contact the admin.", 503);
  }

  const token = generateZegoToken04(env.zegoAppId, req.user.id, env.zegoServerSecret, TOKEN_TTL_SECONDS);

  res.status(200).json({
    status: "success",
    data: {
      appId: env.zegoAppId,
      userId: req.user.id,
      token,
      expiresAt: new Date(Date.now() + TOKEN_TTL_SECONDS * 1000).toISOString(),
    },
  });
});

// POST /api/v1/calls/register
// Called right when the app is about to send the ZEGOCLOUD invitation. This
// does NOT start billing — it just records who's calling whom on which room,
// so the room_create webhook (the actual trustworthy "call connected" signal)
// has something to match against and turn into an ongoing, billed call.
exports.registerCall = asyncHandler(async (req, res) => {
  const { lawyerId, mode, zegoRoomId } = req.body;
  console.log(`[register] caller=${req.user.id} lawyerId=${lawyerId} mode=${mode} zegoRoomId="${zegoRoomId}"`);

  const check = await checkCallAllowed(req.user.id, lawyerId, mode);
  if (!check.allowed) {
    console.log(`[register] REJECTED — ${check.reason}: ${check.message}`);
    throw new AppError(check.message, 409);
  }

  const existingRoom = await CallSession.findOne({ zegoRoomId });
  if (existingRoom) {
    throw new AppError("This call room is already registered", 409);
  }

  const callSession = await CallSession.create({
    caller: req.user.id,
    lawyer: lawyerId,
    mode,
    zegoRoomId,
    callFeePerMinute: check.callFeePerMinute,
    status: CALL_STATUS.PENDING,
  });
  console.log(`[register] created callSessionId=${callSession._id} for zegoRoomId="${zegoRoomId}", waiting for room_create webhook`);

  res.status(201).json({
    status: "success",
    data: {
      callSessionId: String(callSession._id),
      callFeePerMinute: callSession.callFeePerMinute,
    },
  });
});

const startBillingLoop = (callSession) => {
  const id = String(callSession._id);
  stopBillingLoop(id); // guard against a duplicate webhook double-starting it

  const handle = setInterval(async () => {
    const current = await CallSession.findById(id);
    if (!current || current.status !== CALL_STATUS.ONGOING) {
      stopBillingLoop(id);
      return;
    }

    const debited = await debitWallet(current.caller, current.callFeePerMinute);
    if (!debited.success) {
      await endCallSettlement(id, "insufficient_balance");
      return;
    }

    await CallSession.updateOne(
      { _id: id },
      { $inc: { minutesBilled: 1, totalCost: current.callFeePerMinute } }
    );
  }, 60 * 1000);

  activeBillingLoops.set(id, handle);
};

// Idempotent: a call already out of "ongoing"/"pending" just no-ops.
async function endCallSettlement(callSessionId, forcedReason = null) {
  const callSession = await CallSession.findById(callSessionId);
  if (!callSession) return null;
  if (![CALL_STATUS.PENDING, CALL_STATUS.ONGOING].includes(callSession.status)) return callSession;

  stopBillingLoop(callSessionId);
  const now = new Date();

  if (callSession.status === CALL_STATUS.ONGOING) {
    const elapsedSeconds = Math.max(0, Math.floor((now - callSession.startedAt) / 1000));
    const minutesOwed = Math.ceil(elapsedSeconds / 60) - callSession.minutesBilled;

    for (let i = 0; i < minutesOwed; i++) {
      const debited = await debitWallet(callSession.caller, callSession.callFeePerMinute);
      if (!debited.success) break; // can't bill more than the wallet has
      callSession.minutesBilled += 1;
      callSession.totalCost += callSession.callFeePerMinute;
    }
    callSession.durationSeconds = elapsedSeconds;
  }

  callSession.status = forcedReason ? CALL_STATUS.FORCE_ENDED : CALL_STATUS.COMPLETED;
  callSession.forcedReason = forcedReason;
  callSession.endedAt = now;
  await callSession.save();
  return callSession;
}

// POST /api/v1/calls/zego-webhook  (public — ZEGOCLOUD calls this, not our users)
exports.zegoWebhook = asyncHandler(async (req, res) => {
  const { event, timestamp, nonce, signature, room_id: roomId } = req.body;
  console.log(`[zego-webhook] received event="${event}" roomId="${roomId}" body=${JSON.stringify(req.body)}`);

  if (!verifyZegoWebhookSignature({ nonce, timestamp, signature })) {
    // Wrong signature = not really ZEGOCLOUD. Don't leak *why* — just refuse.
    console.log(`[zego-webhook] REJECTED — signature did not match for roomId="${roomId}"`);
    return res.status(401).json({ status: "error", message: "Invalid signature" });
  }

  if (event === "room_create") {
    const callSession = await CallSession.findOne({ zegoRoomId: roomId, status: CALL_STATUS.PENDING });
    if (callSession) {
      callSession.status = CALL_STATUS.ONGOING;
      callSession.startedAt = new Date();
      await callSession.save();
      startBillingLoop(callSession);
      console.log(`[zego-webhook] room_create matched callSessionId=${callSession._id} — billing started`);
    } else {
      console.log(`[zego-webhook] room_create — NO pending CallSession found for roomId="${roomId}" (was /calls/register ever called with this exact zegoRoomId?)`);
    }
  } else if (event === "room_close") {
    const callSession = await CallSession.findOne({
      zegoRoomId: roomId,
      status: { $in: [CALL_STATUS.PENDING, CALL_STATUS.ONGOING] },
    });
    if (callSession) {
      await endCallSettlement(callSession._id);
      console.log(`[zego-webhook] room_close matched callSessionId=${callSession._id} — call settled`);
    } else {
      console.log(`[zego-webhook] room_close — no matching pending/ongoing CallSession for roomId="${roomId}" (already settled, or never registered)`);
    }
  }

  // ZEGOCLOUD retries on anything but 2xx — always acknowledge once handled.
  res.sendStatus(200);
});

// GET /api/v1/calls/tick/:callSessionId
exports.getCallTick = asyncHandler(async (req, res) => {
  const callSession = await CallSession.findById(req.params.callSessionId);

  if (!callSession || String(callSession.caller) !== req.user.id) {
    throw new AppError("Call session not found", 404);
  }

  const walletBalance = await getWalletBalance(req.user.id);

  if (callSession.status === CALL_STATUS.PENDING) {
    return res.status(200).json({
      status: "success",
      data: { status: "pending", elapsedSeconds: 0, costSoFar: 0, walletBalance, lowBalanceWarning: null, ended: null },
    });
  }

  if (callSession.status === CALL_STATUS.ONGOING) {
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - callSession.startedAt) / 1000));
    const secondsIntoMinute = elapsedSeconds % 60;
    const lowBalanceWarning =
      walletBalance < callSession.callFeePerMinute ? { secondsRemaining: 60 - secondsIntoMinute } : null;

    return res.status(200).json({
      status: "success",
      data: {
        status: "ongoing",
        elapsedSeconds,
        costSoFar: callSession.totalCost,
        walletBalance,
        lowBalanceWarning,
        ended: null,
      },
    });
  }

  // completed / force_ended
  res.status(200).json({
    status: "success",
    data: {
      status: "ended",
      elapsedSeconds: callSession.durationSeconds,
      costSoFar: callSession.totalCost,
      walletBalance,
      lowBalanceWarning: null,
      ended: {
        forced: callSession.status === CALL_STATUS.FORCE_ENDED,
        reason: callSession.forcedReason,
        durationSeconds: callSession.durationSeconds,
        totalCost: callSession.totalCost,
        callerNewBalance: walletBalance,
      },
    },
  });
});

// Runs periodically (see server.js) to settle calls that never got a proper
// end signal — a stuck "pending" call (never answered, no room_create ever
// arrived) or a stuck "ongoing" call (webhook never arrived to end it).
exports.reapStaleCalls = async () => {
  const now = Date.now();

  const stalePending = await CallSession.find({
    status: CALL_STATUS.PENDING,
    createdAt: { $lt: new Date(now - PENDING_RING_TIMEOUT_MS) },
  });
  for (const call of stalePending) {
    await endCallSettlement(call._id, "no_answer_timeout");
  }

  const staleOngoing = await CallSession.find({
    status: CALL_STATUS.ONGOING,
    startedAt: { $lt: new Date(now - STALE_ONGOING_CEILING_MS) },
  });
  for (const call of staleOngoing) {
    await endCallSettlement(call._id, "stale_timeout");
  }
};
