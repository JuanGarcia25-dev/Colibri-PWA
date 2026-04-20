const asyncHandler = require("express-async-handler");
const riderModel = require("../models/rider.model");
const userModel = require("../models/user.model");
const riderService = require("../services/rider.service");
const { validationResult } = require("express-validator");
const blacklistTokenModel = require("../models/blacklistToken.model");
const jwt = require("jsonwebtoken");
const { getSignedUrlForKey } = require("../services/s3.service");

module.exports.registerRider = asyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { fullname, email, password, phone, vehicle } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  const alreadyExists = await riderModel.findOne({ email: normalizedEmail });

  if (alreadyExists) {
    return res.status(409).json({ message: "Email ya registrado" });
  }

  const userWithEmail = await userModel.findOne({ email: normalizedEmail });
  if (userWithEmail) {
    return res.status(409).json({ message: "Email ya registrado" });
  }

  const rider = await riderService.createRider(
    fullname.firstname,
    fullname.lastname,
    normalizedEmail,
    password,
    phone,
    vehicle.color,
    vehicle.number,
    vehicle.capacity,
    vehicle.type
  );

  const token = rider.generateAuthToken();
  res
    .status(201)
    .json({ message: "Rider registered successfully", token, rider });
});

module.exports.verifyEmail = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Invalid verification link", error: "Token is required" });
    }
  
    let decodedTokenData = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedTokenData || decodedTokenData.purpose !== "email-verification") {
      return res.status(400).json({ message: "You're trying to use an invalid or expired verification link", error: "Invalid token" });
    }
  
    let rider = await riderModel.findOne({ _id: decodedTokenData.id });
  
    if (!rider) {
      return res.status(404).json({ message: "User not found. Please ask for another verification link." });
    }
  
    if (rider.emailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }
  
    rider.emailVerified = true;
    await rider.save();
  
    res.status(200).json({
      message: "Email verified successfully",
    });
});

module.exports.verifyEmailOtp = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  if (!otp) {
    return res.status(400).json({ message: "OTP requerido" });
  }

  const rider = await riderModel
    .findById(req.rider._id)
    .select("+emailOtpHash +emailOtpExpires");

  if (!rider) {
    return res.status(404).json({ message: "User not found. Please ask for another verification link." });
  }

  if (rider.emailVerified) {
    return res.status(400).json({ message: "Email already verified" });
  }

  if (!rider.emailOtpHash || !rider.emailOtpExpires || rider.emailOtpExpires < new Date()) {
    return res.status(400).json({ message: "OTP expirado. Solicita uno nuevo." });
  }

  const crypto = require("crypto");
  const otpHash = crypto.createHash("sha256").update(otp.toString()).digest("hex");

  if (otpHash !== rider.emailOtpHash) {
    return res.status(400).json({ message: "OTP invÃ¡lido" });
  }

  rider.emailVerified = true;
  rider.emailOtpHash = "";
  rider.emailOtpExpires = null;
  await rider.save();

  res.status(200).json({ message: "Email verified successfully" });
});

module.exports.loginRider = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { email, password } = req.body;

  const rider = await riderModel.findOne({ email }).select("+password");
  if (!rider) {
    res.status(404).json({ message: "Invalid email or password" });
  }

  const isMatch = await rider.comparePassword(password);

  if (!isMatch) {
    return res.status(404).json({ message: "Invalid email or password" });
  }

  const token = rider.generateAuthToken();
  res.cookie("token", token);
  const profilephoto = await getSignedUrlForKey(rider.profilephoto);
  res.json({
    message: "Logged in successfully",
    token,
    rider: {
      _id: rider._id,
      fullname: rider.fullname,
      email: rider.email,
      phone: rider.phone,
      profilephoto: profilephoto,
      rides: rider.rides,
      socketId: rider.socketId,
      emailVerified: rider.emailVerified,
      vehicle: rider.vehicle,
      status: rider.status,
      blocked: rider.blocked,
    },
  });
});

module.exports.riderProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ rider: req.rider });
});

module.exports.updateRiderProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { riderData } = req.body;
  const updatedRiderData = await riderModel.findOneAndUpdate(
    { email: req.rider.email },
    riderData,
    { new: true }
  );

  const profilephoto = await getSignedUrlForKey(updatedRiderData.profilephoto);
  res.status(200).json({
    message: "Profile updated successfully",
    user: { ...updatedRiderData.toObject(), profilephoto },
  });
});

module.exports.logoutRider = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  const token = req.cookies.token || req.headers.token;

  await blacklistTokenModel.create({ token });

  res.status(200).json({ message: "Logged out successfully" });
});

module.exports.uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Profile photo is required" });
  }

  const updatedRider = await riderModel.findByIdAndUpdate(
    req.rider._id,
    { profilephoto: req.file.key },
    { new: true }
  );

  const profilephoto = await getSignedUrlForKey(updatedRider.profilephoto);
  res.status(200).json({
    message: "Profile photo updated",
    user: { ...updatedRider.toObject(), profilephoto },
    profilephoto,
  });
});

module.exports.deleteProfilePhoto = asyncHandler(async (req, res) => {
  const updatedRider = await riderModel.findByIdAndUpdate(
    req.rider._id,
    { profilephoto: "" },
    { new: true }
  );

  res.status(200).json({
    message: "Profile photo removed",
    user: updatedRider,
    profilephoto: "",
  });
});

module.exports.resetPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { token, email, otp, password } = req.body;
  let rider;

  if (token) {
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(400).json({ message: "This password reset link has expired or is no longer valid. Please request a new one to continue" });
      } else {
        return res.status(400).json({ message: "The password reset link is invalid or has already been used. Please request a new one to proceed", error: err });
      }
    }

    rider = await riderModel.findById(payload.id);
  } else {
    if (!email || !otp) {
      return res.status(400).json({ message: "Correo y OTP son requeridos" });
    }

    const crypto = require("crypto");
    const otpHash = crypto.createHash("sha256").update(otp.toString()).digest("hex");
    rider = await riderModel
      .findOne({ email: email.trim().toLowerCase() })
      .select("+resetOtpHash +resetOtpExpires");

    if (!rider || !rider.resetOtpHash || !rider.resetOtpExpires) {
      return res.status(400).json({ message: "Solicita un nuevo codigo para continuar" });
    }

    if (rider.resetOtpExpires < new Date()) {
      return res.status(400).json({ message: "El codigo ha expirado. Solicita uno nuevo." });
    }

    if (otpHash !== rider.resetOtpHash) {
      return res.status(400).json({ message: "Codigo invalido" });
    }
  }

  if (!rider) return res.status(404).json({ message: "User not found. Please check your credentials and try again" });

  rider.password = await riderModel.hashPassword(password);
  rider.resetOtpHash = "";
  rider.resetOtpExpires = null;
  await rider.save();

  res.status(200).json({ message: "Your password has been successfully reset. You can now log in with your new credentials" });
});
