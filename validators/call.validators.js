const { z } = require("zod");
const { CALL_MODES } = require("../models/CallSession");

const canStartCallSchema = z.object({
  lawyerId: z.string().trim().min(1, "lawyerId is required"),
  mode: z.enum(Object.values(CALL_MODES)),
});

const registerCallSchema = z.object({
  lawyerId: z.string().trim().min(1, "lawyerId is required"),
  mode: z.enum(Object.values(CALL_MODES)),
  zegoRoomId: z.string().trim().min(1, "zegoRoomId is required"),
});

const endCallSchema = z.object({
  callSessionId: z.string().trim().min(1, "callSessionId is required"),
  reason: z.string().trim().max(100).optional(),
});

module.exports = { canStartCallSchema, registerCallSchema, endCallSchema };
