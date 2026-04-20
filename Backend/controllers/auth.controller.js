const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const userModel = require("../models/user.model");
const riderModel = require("../models/rider.model");
const adminModel = require("../models/admin.model");
const { getSignedUrlForKey } = require("../services/s3.service");

const buildUserResponse = async (user) => ({
  _id: user._id,
  fullname: {
    firstname: user.fullname?.firstname,
    lastname: user.fullname?.lastname,
  },
  email: user.email,
  phone: user.phone,
  profilephoto: await getSignedUrlForKey(user.profilephoto),
  rides: user.rides,
  socketId: user.socketId,
  emailVerified: user.emailVerified,
  driverStatus: user.driverStatus,
  riderRef: user.riderRef,
  blocked: user.blocked,
});

const buildRiderResponse = async (rider) => ({
  _id: rider._id,
  fullname: {
    firstname: rider.fullname?.firstname,
    lastname: rider.fullname?.lastname,
  },
  email: rider.email,
  phone: rider.phone,
  profilephoto: await getSignedUrlForKey(rider.profilephoto),
  rides: rider.rides,
  socketId: rider.socketId,
  emailVerified: rider.emailVerified,
  vehicle: rider.vehicle,
  status: rider.status,
  blocked: rider.blocked,
});

const buildAdminResponse = (admin) => ({
  _id: admin._id,
  fullname: {
    firstname: admin.fullname?.firstname,
    lastname: admin.fullname?.lastname,
  },
  email: admin.email,
  role: admin.role,
  blocked: admin.blocked,
});

module.exports.loginUnified = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { email, password } = req.body;

  const admin = await adminModel.findOne({ email }).select("+password");
  if (admin) {
    if (admin.blocked) {
      return res.status(403).json({ message: "Cuenta bloqueada" });
    }
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(404).json({ message: "Invalid email or password" });
    }

    const token = admin.generateAuthToken();
    return res.status(200).json({
      message: "Logged in successfully",
      token,
      userType: "admin",
      data: buildAdminResponse(admin),
    });
  }

  const user = await userModel
    .findOne({ email })
    .populate({
      path: "rides",
      populate: {
        path: "rider",
        select: "fullname vehicle",
      },
    })
    .select("+password");

  if (user) {
    if (user.blocked) {
      return res.status(403).json({ message: "Cuenta bloqueada" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(404).json({ message: "Invalid email or password" });
    }

    const rider = await riderModel
      .findOne({ email })
      .populate({
        path: "rides",
        populate: {
          path: "user",
          select: "fullname",
        },
      })
      .select("+password");

    if (rider) {
      if (rider.blocked) {
        return res.status(403).json({ message: "Cuenta bloqueada" });
      }
      const tokenUser = user.generateAuthToken();
      const tokenRider = rider.generateAuthToken();

      return res.status(200).json({
        message: "Logged in successfully",
        roles: ["user", "rider"],
        tokens: { user: tokenUser, rider: tokenRider },
        data: {
          user: await buildUserResponse(user),
          rider: await buildRiderResponse(rider),
        },
      });
    }

    const token = user.generateAuthToken();
    return res.status(200).json({
      message: "Logged in successfully",
      token,
      userType: "user",
      data: await buildUserResponse(user),
    });
  }

  const rider = await riderModel
    .findOne({ email })
    .populate({
      path: "rides",
      populate: {
        path: "user",
        select: "fullname",
      },
    })
    .select("+password");

  if (rider) {
    if (rider.blocked) {
      return res.status(403).json({ message: "Cuenta bloqueada" });
    }
    const isMatch = await rider.comparePassword(password);
    if (!isMatch) {
      return res.status(404).json({ message: "Invalid email or password" });
    }

    const token = rider.generateAuthToken();
    return res.status(200).json({
      message: "Logged in successfully",
      token,
      userType: "rider",
      data: await buildRiderResponse(rider),
    });
  }

  return res.status(404).json({ message: "Invalid email or password" });
});
