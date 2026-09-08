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

module.exports = { canStartCallSchema, registerCallSchema };
