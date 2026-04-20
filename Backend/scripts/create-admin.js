const mongoose = require("mongoose");
require("dotenv").config();
const Admin = require("../models/admin.model");

let bcrypt;
try {
  bcrypt = require("bcrypt");
} catch (e) {
  bcrypt = null;
}

let bcryptjs;
try {
  bcryptjs = require("bcryptjs");
} catch (e) {
  bcryptjs = null;
}

async function hashPassword(password) {
  if (bcrypt) return bcrypt.hash(password, 10);
  if (bcryptjs) return bcryptjs.hash(password, 10);
  throw new Error("No bcrypt implementation found. Install bcryptjs.");
}

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const firstname = process.env.ADMIN_FIRSTNAME || "Admin";
  const lastname = process.env.ADMIN_LASTNAME || "User";

  if (!email || !password) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
    process.exit(1);
  }

  const MONGO_DB = {
    production: { url: process.env.MONGODB_PROD_URL },
    development: { url: process.env.MONGODB_DEV_URL },
  };

  const environment = process.env.ENVIRONMENT || "development";
  const uri = MONGO_DB[environment]?.url;

  if (!uri) {
    console.error("MongoDB URL not found for ENVIRONMENT=" + environment);
    process.exit(1);
  }

  await mongoose.connect(uri);

  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log("Admin already exists:", email);
    process.exit(0);
  }

  const hashed = await hashPassword(password);

  await Admin.create({
    fullname: { firstname, lastname },
    email,
    password: hashed,
  });

  console.log("Admin created:", email);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
