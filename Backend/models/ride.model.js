const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rider",
    },
    pickup: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    fare: {
      type: Number,
      required: true,
    },
    vehicle: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "ongoing", "awaiting_payment", "completed", "cancelled"],
      default: "pending",
    },
    duration: {
      type: Number,
    }, // in seconds

    distance: {
      type: Number,
    }, // in meters

    paymentID: {
      type: String,
    },
    orderId: {
      type: String,
    },
    signature: {
      type: String,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "cancelledByModel",
    },
    cancelledByModel: {
      type: String,
      enum: ["User", "Rider"],
    },
    cancelReason: {
      type: String,
      default: "",
    },
    payment: {
      method: {
        type: String,
        enum: ["cash"],
        default: "cash",
      },
      currency: {
        type: String,
        enum: ["MXN"],
        default: "MXN",
      },
      amountMxn: {
        type: Number,
        default: 0,
      },
      amountUsd: {
        type: Number,
        default: 0,
      },
      fxRate: {
        type: Number,
        default: 0,
      },
      fxUpdatedAt: {
        type: Date,
      },
      status: {
        type: String,
        enum: ["pending", "user_marked_paid", "received"],
        default: "pending",
      },
      userMarkedPaidAt: {
        type: Date,
      },
      riderConfirmedPaidAt: {
        type: Date,
      },
    },
    otp: {
      type: String,
      select: false,
      required: true,
    },
    messages: [
      {
        msg: String,
        by: {
          type: String,
          enum: ["user", "rider"],
        },
        time: String,
        date: String,
        timestamp: Date,
        _id: false
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ride", rideSchema);
