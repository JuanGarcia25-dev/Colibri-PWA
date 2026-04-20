const moment = require("moment-timezone");
const { Server } = require("socket.io");
const userModel = require("./models/user.model");
const rideModel = require("./models/ride.model");
const riderModel = require("./models/rider.model");
const frontendLogModel = require("./models/frontend-log.model");
const collectiveRouteModel = require("./models/collective-route.model");

let io;

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    if (process.env.ENVIRONMENT == "production") {
      socket.on("log", async (log) => {
        log.formattedTimestamp = moment().tz("Asia/Kolkata").format("MMM DD hh:mm:ss A");
        try {
          await frontendLogModel.create(log);
        } catch (error) {
          console.log("Error sending logs...");
        }
      });
    }

    socket.on("join", async (data) => {
      const { userId, userType } = data;
      console.log(userType + " connected: " + userId);
      if (userType === "user") {
        await userModel.findByIdAndUpdate(userId, { socketId: socket.id });
      } else if (userType === "rider") {
        await riderModel.findByIdAndUpdate(userId, { socketId: socket.id });
      }
    });

    socket.on("update-location-rider", async (data) => {
      const { userId, location } = data;

      if (!location || !location.ltd || !location.lng) {
        return socket.emit("error", { message: "Invalid location data" });
      }

      await riderModel.findByIdAndUpdate(userId, {
        location: {
          type: "Point",
          coordinates: [location.lng, location.ltd],
        },
      });

      try {
        const collectiveRoutes = await collectiveRouteModel.find({
          assignedRiders: userId,
          isActive: true,
        }).select("_id");

        collectiveRoutes.forEach((route) => {
          io.to(`collective-route:${route._id.toString()}`).emit(
            "collective-route-rider-location-update",
            {
              latitude: location.ltd,
              longitude: location.lng,
              riderId: userId,
            }
          );
        });

        const activeRides = await rideModel.find({
          rider: userId,
          status: { $in: ["accepted", "ongoing", "started"] },
        });

        activeRides.forEach((ride) => {
          io.to(ride._id.toString()).emit("rider-location-update", {
            latitude: location.ltd,
            longitude: location.lng,
            riderId: userId,
          });
        });
      } catch (error) {
        console.log("Error emitting rider location:", error);
      }
    });

    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      console.log(`${socket.id} joined room: ${roomId}`);
    });

    socket.on("join-collective-route", (routeId) => {
      socket.join(`collective-route:${routeId}`);
      console.log(`${socket.id} joined collective route room: ${routeId}`);
    });

    socket.on("message", async ({ rideId, msg, userType, time }) => {
      const date = moment().tz("Asia/Kolkata").format("MMM DD");
      socket.to(rideId).emit("receiveMessage", { msg, by: userType, time });
      try {
        const ride = await rideModel.findOne({ _id: rideId });
        ride.messages.push({
          msg: msg,
          by: userType,
          time: time,
          date: date,
          timestamp: new Date(),
        });
        await ride.save();
      } catch (error) {
        console.log("Error saving message: ", error);
      }
    });
  });
}

const sendMessageToSocketId = (socketId, messageObject) => {
  if (io) {
    console.log("message sent to: ", socketId);
    io.to(socketId).emit(messageObject.event, messageObject.data);
  } else {
    console.log("Socket.io not initialized.");
  }
};

module.exports = { initializeSocket, sendMessageToSocketId };
