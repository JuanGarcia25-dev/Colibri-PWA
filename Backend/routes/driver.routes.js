const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { authUser } = require("../middlewares/auth.middleware");
const { uploadDriverDocs } = require("../config/upload");
const driverController = require("../controllers/driver-application.controller");

router.post(
  "/apply",
  authUser,
  uploadDriverDocs.fields([
    { name: "profilephoto", maxCount: 1 },
    { name: "curp", maxCount: 1 },
    { name: "ine", maxCount: 1 },
    { name: "license", maxCount: 1 },
    { name: "tioVigente", maxCount: 1 },
    { name: "tarjetaCirculacion", maxCount: 1 },
    { name: "vehicleFront", maxCount: 1 },
    { name: "vehicleRear", maxCount: 1 },
    { name: "vehiclePlate", maxCount: 1 },
  ]),
  body("firstname").isLength({ min: 2, max: 50 }),
  body("lastname").isLength({ min: 2, max: 50 }),
  body("age").isInt({ min: 18 }),
  body("dateOfBirth").notEmpty(),
  body("nationality").isLength({ min: 1, max: 50 }),
  body("sex").notEmpty(),
  body("email").isEmail().isLength({ max: 100 }),
  body("phone").isLength({ min: 10, max: 10 }),
  body("emergencyPhone").isLength({ min: 10, max: 10 }),
  body("vehicleAuto").isLength({ min: 1, max: 30 }),
  body("vehicleModel").isLength({ min: 1, max: 30 }),
  body("vehicleBrand").isLength({ min: 1, max: 30 }),
  body("vehicleColor").isLength({ min: 1, max: 30 }),
  body("vehicleType").isIn(["car", "truck"]),
  body("vehicleCapacity").isInt({ min: 1 }),
  body("vehiclePlate").matches(/^[A-Za-z0-9-]{5,10}$/).withMessage("Invalid vehicle plate"),
  body("vehicleInsurance").isIn(["yes", "no"]),
  driverController.applyDriver
);

module.exports = router;
