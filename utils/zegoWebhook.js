const crypto = require("crypto");
const { env } = require("../config/env");

// ZEGOCLOUD's server-to-server callback signature scheme: sort
// [nonce, timestamp, CallbackSecret] as strings, concatenate, SHA1 hex.
// Verified against ZEGOCLOUD's own documented example before use.
const verifyZegoWebhookSignature = ({ nonce, timestamp, signature }) => {
  if (!nonce || !timestamp || !signature) return false;

  const parts = [String(nonce), String(timestamp), env.zegoCallbackSecret].sort();
  const expected = crypto.createHash("sha1").update(parts.join("")).digest("hex");

  return expected === signature;
};

module.exports = { verifyZegoWebhookSignature };
