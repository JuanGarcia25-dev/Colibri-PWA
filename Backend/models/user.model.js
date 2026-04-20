const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

let bcrypt;
try {
  bcrypt = require("bcrypt");
} catch (e) {
  bcrypt = require("bcryptjs");
}

const userSchema = new mongoose.Schema(
  {
    fullname: {
      firstname: {
        type: String,
        required: true,
        minlength: 3,
      },
      lastname: {
        type: String,
        minlength: 3,
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
    rides: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ride",
      },
    ],
    driverStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    riderRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rider",
    },
    blocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 10);
};

userSchema.methods.generateAuthToken = function () {
  return jwt.sign({ id: this._id, userType: "user" }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
};

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
