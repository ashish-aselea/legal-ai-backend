const crypto = require("crypto");

// ZEGOCLOUD's "token04" algorithm, reimplemented from their official reference
// (github.com/ZEGOCLOUD/zego_server_assistant, token/nodejs/server) — copied as
// source rather than an npm dependency because that's how ZEGOCLOUD distributes
// it. secret must be their ServerSecret (32 bytes), NOT the AppSign.

const randomInt32 = () => Math.ceil(-2147483648 + 4294967295 * Math.random());

const randomIv = () => {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < 16; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
};

const aesAlgorithmFor = (secret) => {
  switch (Buffer.byteLength(secret)) {
    case 16:
      return "aes-128-cbc";
    case 24:
      return "aes-192-cbc";
    case 32:
      return "aes-256-cbc";
    default:
      throw new Error(`ZEGO ServerSecret must be 16, 24 or 32 bytes (got ${Buffer.byteLength(secret)})`);
  }
};

const aesEncrypt = (plainText, secret, iv) => {
  const cipher = crypto.createCipheriv(aesAlgorithmFor(secret), secret, iv);
  return Buffer.concat([cipher.update(plainText), cipher.final()]);
};

// Mints a short-lived Kit token for one user. effectiveTimeInSeconds is how
// long the token stays valid (the Flutter app re-mints well before expiry).
const generateZegoToken04 = (appId, userId, secret, effectiveTimeInSeconds, payload = "") => {
  if (!appId || typeof appId !== "number") throw new Error("appId invalid");
  if (!userId || typeof userId !== "string") throw new Error("userId invalid");
  if (!secret || Buffer.byteLength(secret) !== 32) throw new Error("secret must be a 32 byte string");
  if (!effectiveTimeInSeconds || typeof effectiveTimeInSeconds !== "number") {
    throw new Error("effectiveTimeInSeconds invalid");
  }

  const createTime = Math.floor(Date.now() / 1000);
  const expireTime = createTime + effectiveTimeInSeconds;
  const tokenInfo = {
    app_id: appId,
    user_id: userId,
    nonce: randomInt32(),
    ctime: createTime,
    expire: expireTime,
    payload,
  };

  const iv = randomIv();
  const encrypted = aesEncrypt(JSON.stringify(tokenInfo), secret, iv);

  const expireBuf = Buffer.alloc(8);
  expireBuf.writeBigInt64BE(BigInt(expireTime));
  const ivLenBuf = Buffer.alloc(2);
  ivLenBuf.writeUInt16BE(iv.length);
  const cipherLenBuf = Buffer.alloc(2);
  cipherLenBuf.writeUInt16BE(encrypted.length);

  const packed = Buffer.concat([expireBuf, ivLenBuf, Buffer.from(iv), cipherLenBuf, encrypted]);
  return "04" + packed.toString("base64");
};

module.exports = { generateZegoToken04 };
