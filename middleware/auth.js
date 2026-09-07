const { AppError } = require("./errorHandler");
const { verifyToken } = require("../utils/jwt");
const { User } = require("../models/User");

const extractBearerToken = (req) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError("Authorization token missing", 401);
  }
  return header.slice(7).trim();
};

// Logged-in user (accessToken). Checks isBlocked on every request so a block
// takes effect immediately, even on tokens issued before the block happened.
const authenticate = async (req, res, next) => {
  try {
    const payload = verifyToken(extractBearerToken(req));
    if (payload.type !== "access") {
      throw new AppError("Invalid token type", 401);
    }

    const user = await User.findById(payload.id).select("isBlocked");
    if (!user) {
      throw new AppError("User not found", 401);
    }
    if (user.isBlocked) {
      throw new AppError("Your account has been blocked. Please contact support.", 403);
    }

    req.user = payload;
    next();
  } catch (err) {
    next(err instanceof AppError ? err : new AppError("Invalid or expired token", 401));
  }
};

// Signup-only token issued right after OTP verification (registrationToken)
const authenticateRegistration = (req, res, next) => {
  try {
    const payload = verifyToken(extractBearerToken(req));
    if (payload.type !== "registration") {
      throw new AppError("Invalid token type, registration token required", 401);
    }
    req.registration = payload;
    next();
  } catch (err) {
    next(
      err instanceof AppError
        ? err
        : new AppError("Invalid or expired registration token, please verify OTP again", 401)
    );
  }
};

const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action", 403));
    }
    next();
  };

module.exports = { authenticate, authenticateRegistration, requireRole };
