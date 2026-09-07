const { Readable } = require("stream");
const { env } = require("../config/env");
const cloudinary = require("../config/cloudinary");
const { AppError } = require("../middleware/errorHandler");
const { asyncHandler } = require("../utils/asyncHandler");
const { signAccessToken, signRegistrationToken } = require("../utils/jwt");
const { User, USER_ROLES } = require("../models/User");
const { LawyerProfile, APPROVAL_STATUS } = require("../models/LawyerProfile");
const { OtpVerification } = require("../models/OtpVerification");
const { PracticeArea } = require("../models/PracticeArea");

const buildUserResponse = (user) => ({
  id: String(user._id),
  mobile: user.mobile,
  role: user.role,
  name: user.name,
  email: user.email,
  city: user.city,
  isProfileComplete: user.isProfileComplete,
  profilePhotoUrl: user.profilePhotoUrl,
  isBlocked: user.isBlocked,
});

// POST /api/v1/auth/send-otp
exports.sendOtp = asyncHandler(async (req, res) => {
  const { mobile } = req.body;

  const otp = env.staticOtp;
  const expiresAt = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);

  await OtpVerification.findOneAndUpdate(
    { mobile },
    { mobile, otp, expiresAt },
    { upsert: true, new: true }
  );

  res.status(200).json({
    status: "success",
    message: `OTP sent to ${mobile}`,
    data: {
      mobile,
      expiresInMinutes: env.otpExpiryMinutes,
      // Static OTP is exposed only outside production so the app can be tested without an SMS gateway.
      ...(env.nodeEnv !== "production" ? { otp } : {}),
    },
  });
});

// POST /api/v1/auth/verify-otp
exports.verifyOtp = asyncHandler(async (req, res) => {
  const { mobile, otp } = req.body;

  const record = await OtpVerification.findOne({ mobile });
  if (!record) {
    throw new AppError("OTP not requested or already used, please request a new OTP", 400);
  }
  if (record.expiresAt.getTime() < Date.now()) {
    await OtpVerification.deleteOne({ _id: record._id });
    throw new AppError("OTP has expired, please request a new OTP", 400);
  }
  if (record.otp !== otp) {
    throw new AppError("Invalid OTP", 400);
  }

  await OtpVerification.deleteOne({ _id: record._id });

  const user = await User.findOne({ mobile });

  // New number: no account yet, app must show the "How do you want to join" screen.
  if (!user || !user.role || !user.isProfileComplete) {
    return res.status(200).json({
      status: "success",
      message: "OTP verified. Please choose how you want to join.",
      data: {
        isNewUser: true,
        requiresRoleSelection: true,
        mobile,
        token: signRegistrationToken(mobile),
        tokenType: "registration",
        roles: [USER_ROLES.USER, USER_ROLES.LAWYER],
      },
    });
  }

  if (user.isBlocked) {
    throw new AppError("Your account has been blocked. Please contact support.", 403);
  }

  const token = signAccessToken({
    id: String(user._id),
    mobile: user.mobile,
    role: user.role,
  });

  let approvalStatus;
  if (user.role === USER_ROLES.LAWYER) {
    const profile = await LawyerProfile.findOne({ user: user._id });
    approvalStatus = profile ? profile.approvalStatus : undefined;
  }

  res.status(200).json({
    status: "success",
    message: "Login successful",
    data: {
      isNewUser: false,
      requiresRoleSelection: false,
      token,
      tokenType: "access",
      user: buildUserResponse(user),
      ...(approvalStatus ? { approvalStatus } : {}),
    },
  });
});

// POST /api/v1/auth/signup/user
exports.signupUser = asyncHandler(async (req, res) => {
  const { mobile } = req.registration;
  const { name, email, city } = req.body;

  const existing = await User.findOne({ mobile });
  if (existing && existing.isProfileComplete) {
    throw new AppError("An account already exists for this mobile number", 409);
  }

  const user = await User.findOneAndUpdate(
    { mobile },
    { mobile, name, email, city, role: USER_ROLES.USER, isProfileComplete: true },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const token = signAccessToken({
    id: String(user._id),
    mobile: user.mobile,
    role: USER_ROLES.USER,
  });

  res.status(201).json({
    status: "success",
    message: "Signup successful",
    data: { token, tokenType: "access", user: buildUserResponse(user) },
  });
});

// POST /api/v1/auth/signup/lawyer
exports.signupLawyer = asyncHandler(async (req, res) => {
  const { mobile } = req.registration;
  const {
    name,
    email,
    iAmA,
    barCouncilEnrollmentNumber,
    practiceArea,
    yearsOfExperience,
    cityJurisdiction,
  } = req.body;

  const existing = await User.findOne({ mobile });
  if (existing && existing.isProfileComplete) {
    throw new AppError("An account already exists for this mobile number", 409);
  }

  const validPracticeArea = await PracticeArea.findOne({ name: practiceArea, isActive: true });
  if (!validPracticeArea) {
    throw new AppError(
      "Invalid practiceArea. Fetch the current list from GET /api/v1/practice-areas",
      400
    );
  }

  const user = await User.findOneAndUpdate(
    { mobile },
    {
      mobile,
      name,
      email,
      city: cityJurisdiction,
      role: USER_ROLES.LAWYER,
      isProfileComplete: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const profile = await LawyerProfile.findOneAndUpdate(
    { user: user._id },
    {
      user: user._id,
      iAmA,
      barCouncilEnrollmentNumber,
      practiceArea,
      yearsOfExperience,
      cityJurisdiction,
      approvalStatus: APPROVAL_STATUS.PENDING,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const token = signAccessToken({
    id: String(user._id),
    mobile: user.mobile,
    role: USER_ROLES.LAWYER,
  });

  res.status(201).json({
    status: "success",
    message:
      "Profile submitted for review. Our team will verify your details within 24-48 hours.",
    data: {
      token,
      tokenType: "access",
      user: buildUserResponse(user),
      approvalStatus: profile.approvalStatus,
      lawyerProfile: profile,
    },
  });
});

// GET /api/v1/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  let lawyerProfile = null;
  if (user.role === USER_ROLES.LAWYER) {
    lawyerProfile = await LawyerProfile.findOne({ user: user._id });
  }

  res.status(200).json({
    status: "success",
    data: {
      user: buildUserResponse(user),
      approvalStatus: lawyerProfile ? lawyerProfile.approvalStatus : undefined,
      canAccessHome:
        user.role !== USER_ROLES.LAWYER ||
        (lawyerProfile && lawyerProfile.approvalStatus === APPROVAL_STATUS.APPROVED),
      lawyerProfile,
    },
  });
});

// PATCH /api/v1/auth/me
exports.updateMe = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user.id, { $set: req.body }, { new: true });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.status(200).json({
    status: "success",
    message: "Profile updated",
    data: { user: buildUserResponse(user) },
  });
});

// POST /api/v1/auth/logout
// Access tokens are stateless (no server-side session), so there is nothing to invalidate here.
// This endpoint exists so the client has a single, explicit call to make; the app must still
// delete the token from local storage — that is what actually logs the user out.
exports.logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Logged out successfully. Please remove the token from local storage.",
  });
});

const streamUploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    Readable.from(buffer).pipe(uploadStream);
  });

// PATCH /api/v1/auth/me/photo  (multipart/form-data, field name "photo")
exports.uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError(
      "No image provided. Send it as multipart/form-data with field name 'photo'.",
      400
    );
  }

  const user = await User.findById(req.user.id).select("+profilePhotoPublicId");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const result = await streamUploadToCloudinary(
    req.file.buffer,
    `legal-ai/profile-photos/${user._id}`
  );
  const oldPublicId = user.profilePhotoPublicId;

  user.profilePhotoUrl = result.secure_url;
  user.profilePhotoPublicId = result.public_id;
  await user.save();

  // Best-effort cleanup of the previous photo; failure here shouldn't fail the request.
  if (oldPublicId) {
    cloudinary.uploader.destroy(oldPublicId).catch(() => {});
  }

  res.status(200).json({
    status: "success",
    message: "Profile photo updated",
    data: { user: buildUserResponse(user) },
  });
});
