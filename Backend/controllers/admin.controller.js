const asyncHandler = require("express-async-handler");
const DriverApplication = require("../models/driver-application.model");
const userModel = require("../models/user.model");
const riderModel = require("../models/rider.model");
const adminModel = require("../models/admin.model");
const FareConfig = require("../models/fare-config.model");
const rideModel = require("../models/ride.model");
const { getSignedReadUrl } = require("../services/s3.service");
const { validationResult } = require("express-validator");

module.exports.adminProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ admin: req.admin });
});

module.exports.listDriverApplications = asyncHandler(async (req, res) => {
  const status = req.query.status;
  const filter = status ? { status } : {};
  const applications = await DriverApplication.find(filter)
    .populate("user", "email fullname phone driverStatus")
    .sort({ createdAt: -1 });

  res.status(200).json({ applications });
});

module.exports.approveDriverApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const application = await DriverApplication.findById(id);
  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }

  if (application.status === "approved") {
    return res.status(400).json({ message: "Application already approved" });
  }

  const docs = application.documents || {};
  const docKeys = Object.keys(docs);
  const allApproved = docKeys.length > 0 && docKeys.every((k) => docs[k]?.status === "approved");
  if (!allApproved) {
    return res.status(400).json({ message: "All documents must be approved" });
  }

  const user = await userModel.findById(application.user).select("+password");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  let rider = await riderModel.findOne({ email: application.email });
  const vehicleFromApp = {
    color: application.vehicle?.color || "N/A",
    number: application.vehicle?.plate || "N/A",
    capacity: application.vehicle?.capacity || 1,
    type: application.vehicle?.type || "car",
  };

  if (!rider) {
    rider = await riderModel.create({
      fullname: application.fullname,
      email: application.email,
      password: user.password,
      phone: application.phone,
      profilephoto: application.profilephoto?.key || "",
      vehicle: vehicleFromApp,
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
      emailVerified: user.emailVerified,
    });
  } else {
    rider.vehicle = { ...rider.vehicle, ...vehicleFromApp };
    if (!rider.phone) rider.phone = application.phone;
    if (application.profilephoto?.key) {
      rider.profilephoto = application.profilephoto.key;
    }
    await rider.save();
  }

  application.status = "approved";
  await application.save();

  user.driverStatus = "approved";
  user.riderRef = rider._id;
  await user.save();

  res.status(200).json({ message: "Application approved", riderId: rider._id });
});

module.exports.rejectDriverApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  const application = await DriverApplication.findById(id);
  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }

  application.status = "rejected";
  application.reviewNotes = notes || "";
  await application.save();

  await userModel.findByIdAndUpdate(application.user, {
    driverStatus: "rejected",
  });

  res.status(200).json({ message: "Application rejected" });
});

module.exports.reviewDocument = asyncHandler(async (req, res) => {
  const { id, docKey } = req.params;
  const { status, note } = req.body;

  if (!status || !["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const application = await DriverApplication.findById(id);
  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }

  if (!application.documents || !application.documents[docKey]) {
    return res.status(404).json({ message: "Document not found" });
  }

  application.documents[docKey].status = status;
  application.documents[docKey].note = note || "";

  await application.save();

  res.status(200).json({ message: "Document reviewed" });
});

module.exports.listUsers = asyncHandler(async (req, res) => {
  const role = req.query.role || "all";
  const q = req.query.q || "";

  const match = q
    ? {
        $or: [
          { email: { $regex: "^" + q, $options: "i" } },
          { "fullname.firstname": { $regex: "^" + q, $options: "i" } },
          { "fullname.lastname": { $regex: "^" + q, $options: "i" } },
          { phone: { $regex: q, $options: "i" } },
        ],
      }
    : {};

  if (role === "admin") {
    const admins = await adminModel
      .find(match)
      .select("-password")
      .sort({ createdAt: -1 });
    return res.status(200).json({ users: admins, role: "admin" });
  }

  if (role === "rider") {
    const riders = await riderModel
      .find(match)
      .select("-password")
      .sort({ createdAt: -1 });
    return res.status(200).json({ users: riders, role: "rider" });
  }

  if (role === "user") {
    const users = await userModel
      .find(match)
      .select("-password")
      .sort({ createdAt: -1 });
    return res.status(200).json({ users, role: "user" });
  }

  const users = await userModel
    .find(match)
    .select("-password")
    .sort({ createdAt: -1 });
  const riders = await riderModel
    .find(match)
    .select("-password")
    .sort({ createdAt: -1 });
  const admins = await adminModel
    .find(match)
    .select("-password")
    .sort({ createdAt: -1 });

  const merged = [
    ...users.map((u) => ({ ...u.toObject(), role: "user" })),
    ...riders.map((r) => ({ ...r.toObject(), role: "rider" })),
    ...admins.map((a) => ({ ...a.toObject(), role: "admin" })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.status(200).json({ users: merged, role: "all" });
});

module.exports.toggleUserBlock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role, blocked } = req.body;

  if (!role || typeof blocked !== "boolean") {
    return res.status(400).json({ message: "role and blocked are required" });
  }

  if (role === "admin") {
    await adminModel.findByIdAndUpdate(id, { blocked });
    return res.status(200).json({ message: "Admin updated" });
  }

  if (role === "rider") {
    await riderModel.findByIdAndUpdate(id, { blocked });
    return res.status(200).json({ message: "Rider updated" });
  }

  if (role === "user") {
    await userModel.findByIdAndUpdate(id, { blocked });
    return res.status(200).json({ message: "User updated" });
  }

  return res.status(400).json({ message: "Invalid role" });
});

module.exports.resetPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { email, otp, password } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: "Correo y OTP son requeridos" });
  }

  const crypto = require("crypto");
  const otpHash = crypto.createHash("sha256").update(otp.toString()).digest("hex");
  const admin = await adminModel
    .findOne({ email: email.trim().toLowerCase() })
    .select("+resetOtpHash +resetOtpExpires");

  if (!admin || !admin.resetOtpHash || !admin.resetOtpExpires) {
    return res.status(400).json({ message: "Solicita un nuevo codigo para continuar" });
  }

  if (admin.resetOtpExpires < new Date()) {
    return res.status(400).json({ message: "El codigo ha expirado. Solicita uno nuevo." });
  }

  if (otpHash !== admin.resetOtpHash) {
    return res.status(400).json({ message: "Codigo invalido" });
  }

  admin.password = await adminModel.hashPassword(password);
  admin.resetOtpHash = "";
  admin.resetOtpExpires = null;
  await admin.save();

  res.status(200).json({
    message: "Your password has been successfully reset. You can now log in with your new credentials",
  });
});

module.exports.getFares = asyncHandler(async (req, res) => {
  const fares = await FareConfig.find({}).sort({ vehicleType: 1 });
  res.status(200).json({ fares });
});

module.exports.updateFares = asyncHandler(async (req, res) => {
  const { fares } = req.body;
  if (!Array.isArray(fares)) {
    return res.status(400).json({ message: "fares must be an array" });
  }

  // Validación de datos antes de guardar
  for (let f of fares) {
    if (!f.vehicleType || f.baseFare === undefined || f.perKmRate === undefined || f.perMinuteRate === undefined) {
      return res.status(400).json({ message: "Todos los campos son requeridos" });
    }

    const baseFare = Number(f.baseFare);
    const perKmRate = Number(f.perKmRate);
    const perMinuteRate = Number(f.perMinuteRate);

    if (isNaN(baseFare) || isNaN(perKmRate) || isNaN(perMinuteRate)) {
      return res.status(400).json({ message: "Solo se permiten números válidos (sin símbolos ni notación científica)" });
    }

    if (baseFare <= 0 || perKmRate <= 0 || perMinuteRate <= 0) {
      return res.status(400).json({ message: "Los valores deben ser mayores a 0" });
    }
  }

  const bulk = fares.map((f) => ({
    updateOne: {
      filter: { vehicleType: f.vehicleType },
      update: {
        $set: {
          baseFare: Number(f.baseFare),
          perKmRate: Number(f.perKmRate),
          perMinuteRate: Number(f.perMinuteRate),
        },
      },
      upsert: true,
    },
  }));

  if (bulk.length > 0) {
    await FareConfig.bulkWrite(bulk);
  }

  const updated = await FareConfig.find({}).sort({ vehicleType: 1 });
  res.status(200).json({ fares: updated });
});

module.exports.getMetrics = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalUsers = await userModel.countDocuments();
  const totalRiders = await riderModel.countDocuments();

  const ridesToday = await rideModel.countDocuments({
    createdAt: { $gte: today },
  });

  const completedRides = await rideModel.countDocuments({ status: "completed" });

  const revenueAgg = await rideModel.aggregate([
    { $match: { status: "completed" } },
    { $group: { _id: null, total: { $sum: "$fare" } } },
  ]);

  const revenue = revenueAgg.length ? revenueAgg[0].total : 0;

  res.status(200).json({
    totals: {
      users: totalUsers,
      riders: totalRiders,
      ridesToday,
      completedRides,
      revenue,
    },
  });
});

module.exports.getDocumentUrl = asyncHandler(async (req, res) => {
  const { key } = req.query;
  if (!key) {
    return res.status(400).json({ message: "key is required" });
  }

  const signedUrl = await getSignedReadUrl(key, 300);
  res.status(200).json({ url: signedUrl });
});
