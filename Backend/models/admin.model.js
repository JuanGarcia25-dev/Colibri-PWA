const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

let bcrypt;
try {
  bcrypt = require("bcrypt");
} catch (e) {
  bcrypt = require("bcryptjs");
}

const adminSchema = new mongoose.Schema(
  {
    fullname: {
      firstname: {
        type: String,
        required: true,
        minlength: 2,
      },
      lastname: {
        type: String,
        minlength: 2,
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      default: "admin",
      enum: ["admin"],
    },
    blocked: {
      type: Boolean,
      default: false,
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
  },
  { timestamps: true }
);

adminSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 10);
};

adminSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, userType: "admin" },
    process.env.JWT_SECRET,
    {
      expiresIn: "24h",
    }
  );
};

adminSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("Admin", adminSchema);
