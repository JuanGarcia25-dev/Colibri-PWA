const mongoose = require("mongoose");

const docSchema = new mongoose.Schema(
  {
    url: String,
    key: String,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    note: { type: String },
  },
  { _id: false }
);

const driverApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullname: {
      firstname: { type: String, required: true },
      lastname: { type: String, required: true },
    },
    age: { type: Number, required: true },
    dateOfBirth: { type: String, required: true },
    nationality: { type: String, required: true },
    sex: { type: String, required: true },
    conditions: { type: String },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    emergencyPhone: { type: String, required: true },
    vehicle: {
      auto: { type: String, required: true },
      model: { type: String, required: true },
      brand: { type: String, required: true },
      color: { type: String, required: true },
      type: { type: String, enum: ["car", "truck"], required: true },
      capacity: { type: Number, required: true },
      plate: { type: String, required: true },
      hasInsurance: { type: Boolean, required: true },
    },
    documents: {
      curp: docSchema,
      ine: docSchema,
      license: docSchema,
      tioVigente: docSchema,
      tarjetaCirculacion: docSchema,
      vehicleFront: docSchema,
      vehicleRear: docSchema,
      vehiclePlate: docSchema,
    },
    profilephoto: docSchema,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewNotes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "DriverApplication",
  driverApplicationSchema
);
