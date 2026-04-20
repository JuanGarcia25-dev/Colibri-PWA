const riderModel = require("../models/rider.model");
const rideModel = require("../models/ride.model");
const mapService = require("./map.service");
const crypto = require("crypto");
const FareConfig = require("../models/fare-config.model");
const currencyService = require("./currency.service");

const getFare = async (pickup, destination) => {
  if (!pickup || !destination) {
    throw new Error("Pickup and destination are required");
  }

  const distanceTime = await mapService.getDistanceTime(pickup, destination);

  const fareConfigs = await FareConfig.find({}).lean();

  const baseFare = {
    car: 30,
    truck: 30,
  };

  const perKmRate = {
    car: 10,
    truck: 5,
  };

  const perMinuteRate = {
    car: 2,
    truck: 1,
  };

  fareConfigs.forEach((f) => {
    const mappedType =
      f.vehicleType === "auto"
        ? "car"
        : f.vehicleType === "car"
          ? "truck"
          : f.vehicleType;

    if (!mappedType) return;

    if (mappedType in baseFare) {
      baseFare[mappedType] = f.baseFare;
      perKmRate[mappedType] = f.perKmRate;
      perMinuteRate[mappedType] = f.perMinuteRate;
    }
  });

  const fare = {
    car: Math.round(
      baseFare.car +
        (distanceTime.distance.value / 1000) * perKmRate.car +
        (distanceTime.duration.value / 60) * perMinuteRate.car
    ),
    truck: Math.round(
      baseFare.truck +
        (distanceTime.distance.value / 1000) * perKmRate.truck +
        (distanceTime.duration.value / 60) * perMinuteRate.truck
    ),
  };

  return { fare, distanceTime };
};

module.exports.getFare = getFare;

function getOtp(num) {
  function generateOtp(num) {
    const otp = crypto
      .randomInt(Math.pow(10, num - 1), Math.pow(10, num))
      .toString();
    return otp;
  }
  return generateOtp(num);
}

module.exports.createRide = async ({
  user,
  pickup,
  destination,
  vehicleType,
}) => {
  if (!user || !pickup || !destination || !vehicleType) {
    throw new Error("All fields are required");
  }

  try {
    const { fare, distanceTime } = await getFare(pickup, destination);

    const selectedFare = fare[vehicleType];
    const paymentSummary = currencyService.buildPaymentSummaryFromMxn(selectedFare);

    const ride = rideModel.create({
      user,
      pickup,
      destination,
      otp: getOtp(6),
      fare: selectedFare,
      vehicle: vehicleType,
      distance: distanceTime.distance.value,
      duration: distanceTime.duration.value,
      payment: paymentSummary,
    });

    return ride;
  } catch (error) {
    throw new Error("Error occured while creating ride.");
  }
};

// when ride request is accepted by rider
module.exports.confirmRide = async ({ rideId, rider }) => {
  if (!rideId) {
    throw new Error("Ride id is required");
  }

  try {
    await rideModel.findOneAndUpdate(
      {
        _id: rideId,
      },
      {
        status: "accepted",
        rider: rider._id,
      }
    );

    const riderData = await riderModel.findOne({ _id: rider._id });

    riderData.rides.push(rideId);

    await riderData.save();

    const ride = await rideModel
      .findOne({
        _id: rideId,
      })
      .populate("user")
      .populate("rider")
      .select("+otp");

    if (!ride) {
      throw new Error("Ride not found");
    }

    return ride;
  } catch (error) {
    console.log(error);
    throw new Error("Error occured while confirming ride.");
  }
};

module.exports.startRide = async ({ rideId, otp, rider }) => {
  if (!rideId || !otp) {
    throw new Error("Ride id and OTP are required");
  }

  const ride = await rideModel
    .findOne({
      _id: rideId,
    })
    .populate("user")
    .populate("rider")
    .select("+otp");

  if (!ride) {
    throw new Error("Ride not found");
  }

  if (ride.status !== "accepted") {
    throw new Error("Ride not accepted");
  }

  // Convertir ambos a string y hacer trim para comparación segura
  const cleanInputOtp = otp.toString().trim();
  const cleanStoredOtp = ride.otp.toString().trim();

  if (cleanStoredOtp !== cleanInputOtp) {
    throw new Error("Invalid OTP");
  }

  await rideModel.findOneAndUpdate(
    {
      _id: rideId,
    },
    {
      status: "ongoing",
    }
  );

  return ride;
};

module.exports.endRide = async ({ rideId, rider }) => {
  if (!rideId) {
    throw new Error("Ride id is required");
  }

  const ride = await rideModel
    .findOne({
      _id: rideId,
      rider: rider._id,
    })
    .populate("user")
    .populate("rider")
    .select("+otp");

  if (!ride) {
    throw new Error("Ride not found");
  }

  if (ride.status !== "ongoing") {
    throw new Error("Ride not ongoing");
  }

  await rideModel.findOneAndUpdate(
    {
      _id: rideId,
    },
    {
      status: "awaiting_payment",
      "payment.status": "pending",
    }
  );

  return await rideModel
    .findOne({
      _id: rideId,
      rider: rider._id,
    })
    .populate("user")
    .populate("rider")
    .select("+otp");
};

module.exports.markUserPaid = async ({ rideId, user }) => {
  if (!rideId) {
    throw new Error("Ride id is required");
  }

  const ride = await rideModel
    .findOne({
      _id: rideId,
      user: user._id,
    })
    .populate("user")
    .populate("rider")
    .select("+otp");

  if (!ride) {
    throw new Error("Ride not found");
  }

  if (ride.status !== "awaiting_payment") {
    throw new Error("Ride is not awaiting payment");
  }

  ride.payment = ride.payment || {};
  ride.payment.status = "user_marked_paid";
  ride.payment.userMarkedPaidAt = new Date();
  await ride.save();

  return ride;
};

module.exports.confirmPayment = async ({ rideId, rider }) => {
  if (!rideId) {
    throw new Error("Ride id is required");
  }

  const ride = await rideModel
    .findOne({
      _id: rideId,
      rider: rider._id,
    })
    .populate("user")
    .populate("rider")
    .select("+otp");

  if (!ride) {
    throw new Error("Ride not found");
  }

  if (ride.status !== "awaiting_payment") {
    throw new Error("Ride is not awaiting payment");
  }

  ride.status = "completed";
  ride.payment = ride.payment || {};
  ride.payment.status = "received";
  ride.payment.riderConfirmedPaidAt = new Date();
  await ride.save();

  return ride;
};
