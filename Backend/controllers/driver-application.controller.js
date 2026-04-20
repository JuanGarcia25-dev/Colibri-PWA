const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const DriverApplication = require("../models/driver-application.model");
const userModel = require("../models/user.model");

const mapFile = (file) =>
  file
    ? {
        url: file.location,
        key: file.key,
      }
    : undefined;

const requireFiles = (files, fields) => {
  const missing = fields.filter((name) => !files?.[name]?.[0]);
  return missing;
};

module.exports.applyDriver = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const userId = req.user?._id;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized User" });
  }

  const user = await userModel.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.driverStatus === "pending") {
    return res.status(400).json({ message: "Application already pending" });
  }

  if (user.driverStatus === "approved") {
    return res.status(400).json({ message: "Already approved as driver" });
  }

  const requiredFiles = [
    "profilephoto",
    "curp",
    "ine",
    "license",
    "tioVigente",
    "tarjetaCirculacion",
    "vehicleFront",
    "vehicleRear",
    "vehiclePlate",
  ];

  const files = req.files || {};
  const missingFiles = requireFiles(files, requiredFiles);
  if (missingFiles.length > 0) {
    return res.status(400).json({
      message: `Missing required files: ${missingFiles.join(", ")}`,
    });
  }

  const {
    firstname,
    lastname,
    age,
    dateOfBirth,
    nationality,
    sex,
    conditions,
    email,
    phone,
    emergencyPhone,
    vehicleAuto,
    vehicleModel,
    vehicleBrand,
    vehicleColor,
    vehicleType,
    vehicleCapacity,
    vehiclePlate,
    vehicleInsurance,
  } = req.body;

  const application = await DriverApplication.create({
    user: userId,
    fullname: { firstname, lastname },
    age,
    dateOfBirth,
    nationality,
    sex,
    conditions,
    email,
    phone,
    emergencyPhone,
    vehicle: {
      auto: vehicleAuto,
      model: vehicleModel,
      brand: vehicleBrand,
      color: vehicleColor,
      type: vehicleType,
      capacity: Number(vehicleCapacity),
      plate: vehiclePlate,
      hasInsurance: vehicleInsurance === "yes" || vehicleInsurance === true,
    },
    documents: {
      curp: mapFile(files.curp?.[0]),
      ine: mapFile(files.ine?.[0]),
      license: mapFile(files.license?.[0]),
      tioVigente: mapFile(files.tioVigente?.[0]),
      tarjetaCirculacion: mapFile(files.tarjetaCirculacion?.[0]),
      vehicleFront: mapFile(files.vehicleFront?.[0]),
      vehicleRear: mapFile(files.vehicleRear?.[0]),
      vehiclePlate: mapFile(files.vehiclePlate?.[0]),
    },
    profilephoto: mapFile(files.profilephoto?.[0]),
  });

  user.driverStatus = "pending";
  await user.save();

  res.status(201).json({
    message: "Driver application submitted",
    application,
  });
});
