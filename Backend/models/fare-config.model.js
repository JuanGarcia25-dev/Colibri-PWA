const mongoose = require("mongoose");

const fareSchema = new mongoose.Schema(
  {
    vehicleType: {
      type: String,
      enum: ["car", "truck"],
      required: true,
      unique: true,
    },
    baseFare: { type: Number, required: true },
    perKmRate: { type: Number, required: true },
    perMinuteRate: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FareConfig", fareSchema);
