const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

let bcrypt;
try {
  bcrypt = require("bcrypt");
} catch (e) {
  bcrypt = require("bcryptjs");
}

const riderSchema = new mongoose.Schema(
  {
    fullname: {
      firstname: {
        type: String,
        required: true,
        minlength: 3,
      },
      lastname: {
        type: String,
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    phone: {
      type: String,
      minlength: 10,
      maxlength: 10,
    },
    profilephoto: {
      type: String,
      default: "",
    },
    socketId: {
      type: String,
    },
    rides: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ride",
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
    },
    vehicle: {
      color: {
        type: String,
        required: true,
        minlength: [3, "Color must be at least 3 characters long"],
      },
      number: {
        type: String,
        required: true,
        minlength: [3, "Plate must be at least 3 characters long"],
      },
      capacity: {
        type: Number,
        required: true,
      },
      type: {
        type: String,
        required: true,
        enum: ["car", "truck"],
      },
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailOtpHash: {
      type: String,
      default: "",
      select: false,
    },
    emailOtpExpires: {
      type: Date,
    },
    resetOtpHash: {
      type: String,
      default: "",
      select: false,
    },
    resetOtpExpires: {
      type: Date,
      select: false,
    },
    blocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

riderSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 10);
};

riderSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, userType: "rider" },
    process.env.JWT_SECRET,
    {
      expiresIn: "24h",
    }
  );
};

riderSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("Rider", riderSchema);
