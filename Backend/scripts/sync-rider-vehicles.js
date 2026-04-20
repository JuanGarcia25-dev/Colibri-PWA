require("dotenv").config();
const mongoose = require("mongoose");
const DriverApplication = require("../models/driver-application.model");
const riderModel = require("../models/rider.model");

const connect = async () => {
  const url =
    process.env.ENVIRONMENT === "production"
      ? process.env.MONGODB_PROD_URL
      : process.env.MONGODB_DEV_URL;
  if (!url) {
    throw new Error("Missing MongoDB URL");
  }
  await mongoose.connect(url);
};

const run = async () => {
  await connect();
  const applications = await DriverApplication.find({ status: "approved" });
  let updated = 0;
  for (const app of applications) {
    if (!app?.email) continue;
    const rider = await riderModel.findOne({ email: app.email });
    if (!rider) continue;
    const vehicleFromApp = {
      color: app.vehicle?.color || "N/A",
      number: app.vehicle?.plate || "N/A",
      capacity: app.vehicle?.capacity || 1,
      type: app.vehicle?.type || "car",
    };
    rider.vehicle = { ...rider.vehicle, ...vehicleFromApp };
    if (!rider.phone) rider.phone = app.phone;
    await rider.save();
    updated += 1;
  }
  console.log(`Updated riders: ${updated}`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
