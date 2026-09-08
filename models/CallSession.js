const mongoose = require("mongoose");

const CALL_MODES = { VOICE: "voice", VIDEO: "video" };

const CALL_STATUS = {
  PENDING: "pending", // registered by the app, waiting for ZEGOCLOUD's room_create webhook
  ONGOING: "ongoing", // room_create webhook received, billing loop running
  COMPLETED: "completed",
  FORCE_ENDED: "force_ended", // ended by us (insufficient balance, stale timeout)
};

const callSessionSchema = new mongoose.Schema(
  {
    caller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lawyer: { type: mongoose.Schema.Types.ObjectId, ref: "LawyerProfile", required: true, index: true },
    mode: { type: String, enum: Object.values(CALL_MODES), required: true },
    // Whatever room identifier the Flutter app's ZEGOCLOUD Kit generates for
    // this call invitation — how we match ZEGOCLOUD's webhook back to this row.
    zegoRoomId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: Object.values(CALL_STATUS),
      default: CALL_STATUS.PENDING,
      index: true,
    },
    // Snapshotted from the lawyer's rate when the call is registered — never
    // re-read live, so a rate change mid-call can't retroactively affect it.
    callFeePerMinute: { type: Number, required: true, min: 0 },
    startedAt: { type: Date, default: null }, // set once the room_create webhook confirms media connected
    endedAt: { type: Date, default: null },
    durationSeconds: { type: Number, default: 0 },
    minutesBilled: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    forcedReason: { type: String, default: null }, // e.g. "insufficient_balance", "stale_timeout"
  },
  { timestamps: true }
);

const CallSession = mongoose.model("CallSession", callSessionSchema);

module.exports = { CallSession, CALL_MODES, CALL_STATUS };
