const blacklistTokenModel = require("../models/blacklistToken.model");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const riderModel = require("../models/rider.model");
const adminModel = require("../models/admin.model");
const { getSignedUrlForKey } = require("../services/s3.service");

module.exports.authUser = async (req, res, next) => {
  const token = req.cookies.token || req.headers.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized User" });
  }

  const isBlacklisted = await blacklistTokenModel.findOne({ token });
  if (isBlacklisted) {
    return res.status(401).json({ message: "Blacklisted Unauthorized User" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findOne({ _id: decoded.id }).populate({
      path: "rides",
      populate: {
        path: "rider",
        select: "fullname vehicle",
      },
    });
    if (!user) {
      return res.status(401).json({ message: "Unauthorized User" });
    }
    const profilephoto = await getSignedUrlForKey(user.profilephoto);

    req.user = {
      _id: user._id,
      fullname: {
        firstname: user.fullname.firstname,
        lastname: user.fullname.lastname,
      },
      email: user.email,
      phone: user.phone,
      profilephoto,
      rides: user.rides,
      socketId: user.socketId,
      emailVerified: user.emailVerified || false,
      driverStatus: user.driverStatus,
      riderRef: user.riderRef,
    };
    req.userType = "user";

    next();
  } catch (error) {
    if (error.message === "jwt expired") {
      return res.status(401).json({ message: "Token Expired" });
    } else {
      return res.status(401).json({ message: "Unauthorized User", error });
    }
  }
};

module.exports.authRider = async (req, res, next) => {
  const token = req.cookies.token || req.headers.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized User" });
  }

  const isBlacklisted = await blacklistTokenModel.findOne({ token });
  if (isBlacklisted) {
    return res.status(401).json({ message: "Unauthorized User" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const rider = await riderModel
      .findOne({ _id: decoded.id })
      .populate({
        path: "rides",
        populate: {
          path: "user",
          select: "fullname",
        },
      });
    if (!rider) {
      return res.status(401).json({ message: "Unauthorized User" });
    }
    const profilephoto = await getSignedUrlForKey(rider.profilephoto);
    req.rider = {
      _id: rider._id,
      fullname: {
        firstname: rider.fullname.firstname,
        lastname: rider.fullname.lastname,
      },
      email: rider.email,
      phone: rider.phone,
      profilephoto,
      rides: rider.rides,
      socketId: rider.socketId,
      emailVerified: rider.emailVerified,
      vehicle: rider.vehicle,
      status: rider.status,
    };
    req.userType = "rider";
    next();
  } catch (error) {
    if (error.message === "jwt expired") {
      return res.status(401).json({ message: "Token Expired" });
    } else {
      return res.status(401).json({ message: "Unauthorized User", error });
    }
  }
};

module.exports.authUserOrRider = async (req, res, next) => {
  const token = req.cookies.token || req.headers.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized User" });
  }

  const isBlacklisted = await blacklistTokenModel.findOne({ token });
  if (isBlacklisted) {
    return res.status(401).json({ message: "Unauthorized User" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.userType === "user") {
      return module.exports.authUser(req, res, next);
    }

    if (decoded.userType === "rider") {
      return module.exports.authRider(req, res, next);
    }

    return res.status(401).json({ message: "Unauthorized User" });
  } catch (error) {
    if (error.message === "jwt expired") {
      return res.status(401).json({ message: "Token Expired" });
    }
    return res.status(401).json({ message: "Unauthorized User", error });
  }
};

module.exports.authAdmin = async (req, res, next) => {
  const token = req.cookies.token || req.headers.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized User" });
  }

  const isBlacklisted = await blacklistTokenModel.findOne({ token });
  if (isBlacklisted) {
    return res.status(401).json({ message: "Unauthorized User" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await adminModel.findOne({ _id: decoded.id });
    if (!admin) {
      return res.status(401).json({ message: "Unauthorized User" });
    }

    req.admin = {
      _id: admin._id,
      fullname: {
        firstname: admin.fullname?.firstname,
        lastname: admin.fullname?.lastname,
      },
      email: admin.email,
      role: admin.role,
    };
    req.userType = "admin";
    next();
  } catch (error) {
    if (error.message === "jwt expired") {
      return res.status(401).json({ message: "Token Expired" });
    } else {
      return res.status(401).json({ message: "Unauthorized User", error });
    }
  }
};
