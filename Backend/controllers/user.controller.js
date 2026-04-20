const asyncHandler = require("express-async-handler");
const userModel = require("../models/user.model");
const riderModel = require("../models/rider.model");
const userService = require("../services/user.service");
const { validationResult } = require("express-validator");
const blacklistTokenModel = require("../models/blacklistToken.model");
const jwt = require("jsonwebtoken");
const { getSignedUrlForKey } = require("../services/s3.service");

module.exports.registerUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { fullname, email, password, phone } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  const alreadyExists = await userModel.findOne({ email: normalizedEmail });

  if (alreadyExists) {
    return res.status(409).json({ message: "Email ya registrado" });
  }

  const riderWithEmail = await riderModel.findOne({ email: normalizedEmail });
  if (riderWithEmail) {
    return res.status(409).json({ message: "Email ya registrado" });
  }

  const user = await userService.createUser(
    fullname.firstname,
    fullname.lastname,
    normalizedEmail,
    password,
    phone
  );

  const token = user.generateAuthToken();
  res
    .status(201)
    .json({ message: "User registered successfully", token, user });
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

  let user = await userModel.findOne({ _id: decodedTokenData.id });

  if (!user) {
    return res.status(404).json({ message: "User not found. Please ask for another verification link." });
  }

  if (user.emailVerified) {
    return res.status(400).json({ message: "Email already verified" });
  }

  user.emailVerified = true;
  await user.save();

  res.status(200).json({
    message: "Email verified successfully",
  });
});

module.exports.verifyEmailOtp = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  if (!otp) {
    return res.status(400).json({ message: "OTP requerido" });
  }

  const user = await userModel
    .findById(req.user._id)
    .select("+emailOtpHash +emailOtpExpires");

  if (!user) {
    return res.status(404).json({ message: "User not found. Please ask for another verification link." });
  }

  if (user.emailVerified) {
    return res.status(400).json({ message: "Email already verified" });
  }

  if (!user.emailOtpHash || !user.emailOtpExpires || user.emailOtpExpires < new Date()) {
    return res.status(400).json({ message: "OTP expirado. Solicita uno nuevo." });
  }

  const crypto = require("crypto");
  const otpHash = crypto.createHash("sha256").update(otp.toString()).digest("hex");

  if (otpHash !== user.emailOtpHash) {
    return res.status(400).json({ message: "OTP invÃ¡lido" });
  }

  user.emailVerified = true;
  user.emailOtpHash = "";
  user.emailOtpExpires = null;
  await user.save();

  res.status(200).json({ message: "Email verified successfully" });
});

module.exports.loginUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { email, password } = req.body;

  const user = await userModel.findOne({ email }).select("+password");
  if (!user) {
    res.status(404).json({ message: "Invalid email or password" });
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(404).json({ message: "Invalid email or password" });
  }

  const token = user.generateAuthToken();
  res.cookie("token", token);

  const profilephoto = await getSignedUrlForKey(user.profilephoto);

  res.json({
    message: "Logged in successfully",
    token,
    user: {
      _id: user._id,
      fullname: {
        firstname: user.fullname.firstname,
        lastname: user.fullname.lastname,
      },
      email: user.email,
      phone: user.phone,
      profilephoto: profilephoto,
      rides: user.rides,
      socketId: user.socketId,
      emailVerified: user.emailVerified,
    },
  });
});

module.exports.userProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ user: req.user });
});

module.exports.updateUserProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { fullname, phone, profilephoto } = req.body;

  const update = {
    fullname: fullname,
    phone,
  };
  if (profilephoto) {
    update.profilephoto = profilephoto;
  }

  const updatedUserData = await userModel.findOneAndUpdate(
    { _id: req.user._id },
    update,
    { new: true }
  );

  const signedProfilephoto = await getSignedUrlForKey(updatedUserData.profilephoto);
  res
    .status(200)
    .json({
      message: "Profile updated successfully",
      user: { ...updatedUserData.toObject(), profilephoto: signedProfilephoto },
    });
});

module.exports.logoutUser = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  const token = req.cookies.token || req.headers.token;

  await blacklistTokenModel.create({ token });

  res.status(200).json({ message: "Logged out successfully" });
});

module.exports.uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Profile photo is required" });
  }

  const updatedUser = await userModel.findByIdAndUpdate(
    req.user._id,
    { profilephoto: req.file.key },
    { new: true }
  );

  const profilephoto = await getSignedUrlForKey(updatedUser.profilephoto);
  res.status(200).json({
    message: "Profile photo updated",
    user: { ...updatedUser.toObject(), profilephoto },
    profilephoto,
  });
});

module.exports.deleteProfilePhoto = asyncHandler(async (req, res) => {
  const updatedUser = await userModel.findByIdAndUpdate(
    req.user._id,
    { profilephoto: "" },
    { new: true }
  );

  res.status(200).json({
    message: "Profile photo removed",
    user: updatedUser,
    profilephoto: "",
  });
});

module.exports.resetPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { token, email, otp, password } = req.body;
  let user;

  if (token) {
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(400).json({
          message:
            "This password reset link has expired or is no longer valid. Please request a new one to continue",
        });
      } else {
        return res.status(400).json({
          message:
            "The password reset link is invalid or has already been used. Please request a new one to proceed",
          error: err,
        });
      }
    }

    user = await userModel.findById(payload.id);
  } else {
    if (!email || !otp) {
      return res.status(400).json({ message: "Correo y OTP son requeridos" });
    }

    const crypto = require("crypto");
    const otpHash = crypto.createHash("sha256").update(otp.toString()).digest("hex");
    user = await userModel
      .findOne({ email: email.trim().toLowerCase() })
      .select("+resetOtpHash +resetOtpExpires");

    if (!user || !user.resetOtpHash || !user.resetOtpExpires) {
      return res.status(400).json({ message: "Solicita un nuevo codigo para continuar" });
    }

    if (user.resetOtpExpires < new Date()) {
      return res.status(400).json({ message: "El codigo ha expirado. Solicita uno nuevo." });
    }

    if (otpHash !== user.resetOtpHash) {
      return res.status(400).json({ message: "Codigo invalido" });
    }
  }

  if (!user) {
    return res.status(404).json({
      message: "User not found. Please check your credentials and try again",
    });
  }

  user.password = await userModel.hashPassword(password);
  user.resetOtpHash = "";
  user.resetOtpExpires = null;
  await user.save();

  res.status(200).json({
    message:
      "Your password has been successfully reset. You can now log in with your new credentials",
  });
});
