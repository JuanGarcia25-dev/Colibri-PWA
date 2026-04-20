require("dotenv").config();
const socket = require("./socket");
const path = require("path");
const express = require("express");
const { createServer } = require("http");
const app = express();
const server = createServer(app);

socket.initializeSocket(server);

const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const driverRoutes = require("./routes/driver.routes");
const userRoutes = require("./routes/user.routes");
const riderRoutes = require("./routes/rider.routes");
const mapsRoutes = require("./routes/maps.routes");
const rideRoutes = require("./routes/ride.routes");
const mailRoutes = require("./routes/mail.routes");
const collectiveRoutes = require("./routes/collective-routes.routes");
const keepServerRunning = require("./services/active.service");
const dbStream = require("./services/logging.service");
require("./config/db");
const PORT = process.env.PORT || 4000;

if (process.env.ENVIRONMENT == "production") {
  app.use(
    morgan(":method :url :status :response-time ms - :res[content-length]", {
      stream: dbStream,
    })
  );
} else {
  app.use(morgan("dev"));
}
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.ENVIRONMENT == "production") {
  keepServerRunning();
}

app.get("/reload", (req, res) => {
  res.json("Server Reloaded");
});

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/driver", driverRoutes);
app.use("/user", userRoutes);
app.use("/rider", riderRoutes);
app.use("/map", mapsRoutes);
app.use("/ride", rideRoutes);
app.use("/mail", mailRoutes);
app.use("/collective-routes", collectiveRoutes);

// Upload / validation errors (e.g., multer)
app.use((err, req, res, next) => {
  if (err) {
    const message =
      err.message === "Invalid file type"
        ? "Tipo de archivo no permitido"
        : err.code === "LIMIT_FILE_SIZE"
        ? "El archivo supera el tamaño máximo permitido"
        : err.message || "Error al subir archivo";
    return res.status(400).json({ message });
  }
  next();
});

// Servir archivos estáticos de React
app.use(express.static(path.join(__dirname, "dist")));

// Para cualquier ruta que no sea API, enviar index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

server.listen(PORT, () => {
  console.log("Server is listening on port", PORT);
});
