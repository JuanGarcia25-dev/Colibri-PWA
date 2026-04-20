const rideService = require("../services/ride.service");
const { validationResult } = require("express-validator");
const mapService = require("../services/map.service");
const { sendMessageToSocketId } = require("../socket");
const rideModel = require("../models/ride.model");
const userModel = require("../models/user.model");
const { getSignedUrlForKey } = require("../services/s3.service");

const toSignedRidePayload = async (rideDoc) => {
  if (!rideDoc) return rideDoc;
  const ridePayload = rideDoc.toObject ? rideDoc.toObject() : rideDoc;

  if (ridePayload.user) {
    ridePayload.user.profilephoto = await getSignedUrlForKey(ridePayload.user.profilephoto);
  }
  if (ridePayload.rider) {
    ridePayload.rider.profilephoto = await getSignedUrlForKey(ridePayload.rider.profilephoto);
  }

  return ridePayload;
};

module.exports.chatDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const ride = await rideModel
      .findOne({ _id: id })
      .populate("user", "socketId fullname phone profilephoto")
      .populate("rider", "socketId fullname phone profilephoto");

    if (!ride) {
      return res.status(400).json({ message: "Ride not found" });
    }

    const response = {
      user: {
        socketId: ride.user?.socketId,
        fullname: ride.user?.fullname,
        phone: ride.user?.phone,
        profilephoto: await getSignedUrlForKey(ride.user?.profilephoto),
        _id: ride.user?._id,
      },
      rider: {
        socketId: ride.rider?.socketId,
        fullname: ride.rider?.fullname,
        phone: ride.rider?.phone,
        profilephoto: await getSignedUrlForKey(ride.rider?.profilephoto),
        _id: ride.rider?._id,
      },
      messages: ride.messages,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports.getShareDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const ride = await rideModel
      .findOne({ _id: id, status: { $in: ['accepted', 'ongoing'] } })
      .populate("rider", "fullname phone vehicle")
      .lean();

    if (!ride) {
      return res.status(404).json({ message: "Ride not found or has ended" });
    }

    // Enviar solo información necesaria (sin datos sensibles)
    const response = {
      _id: ride._id,
      pickup: ride.pickup,
      destination: ride.destination,
      fare: ride.fare,
      rider: {
        fullname: {
          firstname: ride.rider?.fullname?.firstname,
          lastname: ride.rider?.fullname?.lastname
        },
        phone: ride.rider?.phone,
        vehicle: {
          type: ride.rider?.vehicle?.type,
          color: ride.rider?.vehicle?.color,
          number: ride.rider?.vehicle?.number
        }
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports.createRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { pickup, destination, vehicleType } = req.body;

  try {
    const ride = await rideService.createRide({
      user: req.user._id,
      pickup,
      destination,
      vehicleType,
    });

    const user = await userModel.findOne({ _id: req.user._id });
    if (user) {
      user.rides.push(ride._id);
      await user.save();
    }

    res.status(201).json(ride);

    Promise.resolve().then(async () => {
      try {
        const pickupCoordinates = await mapService.getAddressCoordinate(pickup);
        console.log("Pickup Coordinates", pickupCoordinates);

        const ridersInRadius = await mapService.getRidersInTheRadius(
          pickupCoordinates.ltd,
          pickupCoordinates.lng,
          4,
          vehicleType
        );

        ride.otp = "";

        const rideWithUser = await rideModel
          .findOne({ _id: ride._id })
          .populate("user");

        const ridePayload = await toSignedRidePayload(rideWithUser);

        console.log(
          ridersInRadius.map(
            (ride) => `${ride.fullname.firstname} ${ride.fullname.lastname} `
          )
        );
        ridersInRadius.map((rider) => {
          sendMessageToSocketId(rider.socketId, {
            event: "new-ride",
            data: ridePayload,
          });
        });
      } catch (e) {
        console.error("Background task failed:", e.message);
      }
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.getFare = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { pickup, destination } = req.query;

  try {
    const { fare, distanceTime } = await rideService.getFare(
      pickup,
      destination
    );
    return res.status(200).json({ fare, distanceTime });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.confirmRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.body;

  try {
    const rideDetails = await rideModel.findOne({ _id: rideId });

    if (!rideDetails) {
      return res.status(404).json({ message: "Ride not found." });
    }

    switch (rideDetails.status) {
      case "accepted":
        return res
          .status(400)
          .json({
            message:
              "The ride is accepted by another rider before you. Better luck next time.",
          });

      case "ongoing":
        return res
          .status(400)
          .json({
            message: "The ride is currently ongoing with another rider.",
          });

      case "completed":
        return res
          .status(400)
          .json({ message: "The ride has already been completed." });

      case "cancelled":
        return res
          .status(400)
          .json({ message: "The ride has been cancelled." });

      default:
        break;
    }

    const ride = await rideService.confirmRide({
      rideId,
      rider: req.rider,
    });

    const signedRide = await toSignedRidePayload(ride);

    sendMessageToSocketId(ride.user.socketId, {
      event: "ride-confirmed",
      data: signedRide,
    });

    // TODO: Remove ride from other captains
    // Implement logic here, maybe emit an event or update captain listings

    return res.status(200).json(signedRide);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.startRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId, otp } = req.query;

  try {
    const ride = await rideService.startRide({
      rideId,
      otp,
      rider: req.rider,
    });

    const signedRide = await toSignedRidePayload(ride);

    sendMessageToSocketId(ride.user.socketId, {
      event: "ride-started",
      data: signedRide,
    });

    return res.status(200).json(signedRide);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.endRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.body;

  try {
    const ride = await rideService.endRide({ rideId, rider: req.rider });
    const signedRide = await toSignedRidePayload(ride);

    console.log("Ride ended successfully:", ride._id);
    console.log("User socketId:", ride.user?.socketId);

    if (ride.user?.socketId) {
      sendMessageToSocketId(ride.user.socketId, {
        event: "ride-awaiting-payment",
        data: signedRide,
      });
      // Compatibility event for older clients
      sendMessageToSocketId(ride.user.socketId, {
        event: "ride-ended",
        data: signedRide,
      });
      console.log("ride-awaiting-payment event sent to user");
    } else {
      console.warn("User socketId not found for ride:", rideId);
    }

    if (ride.rider?.socketId) {
      sendMessageToSocketId(ride.rider.socketId, {
        event: "ride-awaiting-payment",
        data: signedRide,
      });
    }

    return res.status(200).json(signedRide);
  } catch (err) {
    console.error("Error ending ride:", err.message);
    return res.status(500).json({ message: err.message });
  }
};

module.exports.markUserPaid = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.body;

  try {
    const ride = await rideService.markUserPaid({ rideId, user: req.user });
    const signedRide = await toSignedRidePayload(ride);

    if (ride.rider?.socketId) {
      sendMessageToSocketId(ride.rider.socketId, {
        event: "ride-user-marked-paid",
        data: signedRide,
      });
    }

    if (ride.user?.socketId) {
      sendMessageToSocketId(ride.user.socketId, {
        event: "ride-user-marked-paid",
        data: signedRide,
      });
    }

    return res.status(200).json(signedRide);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.confirmPayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.body;

  try {
    const ride = await rideService.confirmPayment({ rideId, rider: req.rider });
    const signedRide = await toSignedRidePayload(ride);

    if (ride.user?.socketId) {
      sendMessageToSocketId(ride.user.socketId, {
        event: "ride-payment-confirmed",
        data: signedRide,
      });
    }

    if (ride.rider?.socketId) {
      sendMessageToSocketId(ride.rider.socketId, {
        event: "ride-payment-confirmed",
        data: signedRide,
      });
    }

    return res.status(200).json(signedRide);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.cancelRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId, reason = "" } = req.body;

  try {
    const ride = await rideModel.findById(rideId).populate("user rider");
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (ride.status === "ongoing" || ride.status === "awaiting_payment" || ride.status === "completed" || ride.status === "cancelled") {
      return res.status(400).json({ message: "This ride can no longer be cancelled" });
    }

    if (req.userType === "user") {
      if (String(ride.user?._id) !== String(req.user._id)) {
        return res.status(403).json({ message: "You are not allowed to cancel this ride" });
      }
      if (!["pending", "accepted"].includes(ride.status)) {
        return res.status(400).json({ message: "User can only cancel pending or accepted rides" });
      }
      ride.cancelledBy = req.user._id;
      ride.cancelledByModel = "User";
    } else if (req.userType === "rider") {
      if (String(ride.rider?._id) !== String(req.rider._id)) {
        return res.status(403).json({ message: "You are not allowed to cancel this ride" });
      }
      if (ride.status !== "accepted") {
        return res.status(400).json({ message: "Rider can only cancel before the ride starts" });
      }
      ride.cancelledBy = req.rider._id;
      ride.cancelledByModel = "Rider";
    } else {
      return res.status(403).json({ message: "Invalid user type" });
    }

    ride.status = "cancelled";
    ride.cancelReason = reason;
    await ride.save();

    const payload = {
      _id: ride._id,
      pickup: ride.pickup,
      destination: ride.destination,
      status: ride.status,
      cancelledByModel: ride.cancelledByModel,
      cancelReason: ride.cancelReason,
    };

    if (ride.user?.socketId) {
      sendMessageToSocketId(ride.user.socketId, {
        event: "ride-cancelled",
        data: payload,
      });
    }

    if (ride.rider?.socketId) {
      sendMessageToSocketId(ride.rider.socketId, {
        event: "ride-cancelled",
        data: payload,
      });
    }

    if (req.userType === "user" && !ride.rider) {
      const pickupCoordinates = await mapService.getAddressCoordinate(ride.pickup);
      const ridersInRadius = await mapService.getRidersInTheRadius(
        pickupCoordinates.ltd,
        pickupCoordinates.lng,
        4,
        ride.vehicle
      );

      ridersInRadius.forEach((rider) => {
        sendMessageToSocketId(rider.socketId, {
          event: "ride-cancelled",
          data: payload,
        });
      });
    }

    return res.status(200).json(ride);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
