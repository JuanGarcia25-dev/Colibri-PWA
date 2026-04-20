const mongoose = require("mongoose");

const pointSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  },
  { _id: false }
);

const stopSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    order: { type: Number, required: true },
  },
  { _id: false }
);

const collectiveRouteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    origin: { type: pointSchema, required: true },
    destination: { type: pointSchema, required: true },
    stops: { type: [stopSchema], default: [] },
    assignedRiders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Rider",
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CollectiveRoute", collectiveRouteSchema);
