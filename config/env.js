const dotenv = require("dotenv");

dotenv.config();

const env = {
  port: parseInt(process.env.PORT || "5000", 10),
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/legal-ai",
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "change-this-secret-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "30d",
  registrationTokenExpiresIn: process.env.REGISTRATION_TOKEN_EXPIRES_IN || "15m",
  staticOtp: process.env.STATIC_OTP || "123456",
  otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || "5", 10),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
  zegoAppId: parseInt(process.env.ZEGO_APP_ID || "0", 10),
  zegoServerSecret: process.env.ZEGO_SERVER_SECRET || "",
  zegoCallbackSecret: process.env.ZEGO_CALLBACK_SECRET || "",
};

module.exports = { env };
