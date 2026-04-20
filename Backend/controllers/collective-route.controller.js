const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const CollectiveRoute = require("../models/collective-route.model");
const riderModel = require("../models/rider.model");
const mapService = require("../services/map.service");

const isPointObject = (value) =>
  value &&
  typeof value === "object" &&
  value.coordinates &&
  typeof value.coordinates.lat === "number" &&
  typeof value.coordinates.lng === "number";

const buildPoint = async (value) => {
  if (isPointObject(value)) {
    const label =
      String(value.label || "").trim() ||
      (await mapService.getAddressFromCoordinates(value.coordinates.lat, value.coordinates.lng));

    return {
      label,
      coordinates: {
        lat: value.coordinates.lat,
        lng: value.coordinates.lng,
      },
    };
  }

  const label = String(value || "").trim();
  const coordinates = await mapService.getAddressCoordinate(label);
  return {
    label,
    coordinates: {
      lat: coordinates.ltd,
      lng: coordinates.lng,
    },
  };
};

const buildStops = async (stops = []) => {
  const items = await Promise.all(
    stops.map(async (stop, index) => {
      const point = await buildPoint(stop);
      return {
        label: point.label,
        coordinates: point.coordinates,
        order: index + 1,
      };
    })
  );

  return items.filter((stop) => String(stop.label || "").trim());
};

const validateRouteBody = (body) => {
  const hasName = String(body.name || "").trim().length >= 3;
  const hasOrigin = body.origin && (typeof body.origin === "string" || isPointObject(body.origin));
  const hasDestination =
    body.destination && (typeof body.destination === "string" || isPointObject(body.destination));

  if (!hasName) return "Nombre invalido";
  if (!hasOrigin) return "Origen invalido";
  if (!hasDestination) return "Destino invalido";
  return "";
};

const normalizeAssignedRiders = async (assignedRiders = []) => {
  if (!Array.isArray(assignedRiders) || assignedRiders.length === 0) return [];
  const uniqueIds = [...new Set(assignedRiders.map((id) => String(id)))];
  const riders = await riderModel.find({ _id: { $in: uniqueIds } }).select("_id");
  return riders.map((rider) => rider._id);
};

const serializeRoute = (route) => ({
  _id: route._id,
  name: route.name,
  origin: route.origin,
  destination: route.destination,
  stops: route.stops,
  isActive: route.isActive,
  assignedRiders:
    route.assignedRiders?.map((rider) => ({
      _id: rider._id,
      fullname: rider.fullname,
      phone: rider.phone,
      vehicle: rider.vehicle,
      location: rider.location,
      status: rider.status,
      blocked: rider.blocked,
    })) || [],
  createdAt: route.createdAt,
  updatedAt: route.updatedAt,
});

module.exports.listAdminRoutes = asyncHandler(async (req, res) => {
  const routes = await CollectiveRoute.find({})
    .populate("assignedRiders", "fullname phone vehicle location status blocked")
    .sort({ createdAt: -1 });

  res.status(200).json({ routes: routes.map(serializeRoute) });
});

module.exports.createRoute = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }
  const validationMessage = validateRouteBody(req.body);
  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  const { name, origin, destination, stops = [], assignedRiders = [], isActive = true } = req.body;

  const route = await CollectiveRoute.create({
    name: String(name).trim(),
    origin: await buildPoint(origin),
    destination: await buildPoint(destination),
    stops: await buildStops(stops),
    assignedRiders: await normalizeAssignedRiders(assignedRiders),
    isActive: Boolean(isActive),
  });

  const populatedRoute = await CollectiveRoute.findById(route._id).populate(
    "assignedRiders",
    "fullname phone vehicle location status blocked"
  );

  res.status(201).json({
    message: "Ruta creada correctamente",
    route: serializeRoute(populatedRoute),
  });
});

module.exports.updateRoute = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }
  const validationMessage = validateRouteBody(req.body);
  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  const route = await CollectiveRoute.findById(req.params.id);
  if (!route) {
    return res.status(404).json({ message: "Ruta no encontrada" });
  }

  const { name, origin, destination, stops = [], assignedRiders = [], isActive = true } = req.body;
  route.name = String(name).trim();
  route.origin = await buildPoint(origin);
  route.destination = await buildPoint(destination);
  route.stops = await buildStops(stops);
  route.assignedRiders = await normalizeAssignedRiders(assignedRiders);
  route.isActive = Boolean(isActive);
  await route.save();

  const populatedRoute = await CollectiveRoute.findById(route._id).populate(
    "assignedRiders",
    "fullname phone vehicle location status blocked"
  );

  res.status(200).json({
    message: "Ruta actualizada correctamente",
    route: serializeRoute(populatedRoute),
  });
});

module.exports.toggleRouteStatus = asyncHandler(async (req, res) => {
  const route = await CollectiveRoute.findById(req.params.id);
  if (!route) {
    return res.status(404).json({ message: "Ruta no encontrada" });
  }

  route.isActive = !route.isActive;
  await route.save();

  res.status(200).json({
    message: route.isActive ? "Ruta activada" : "Ruta desactivada",
    isActive: route.isActive,
  });
});

module.exports.deleteRoute = asyncHandler(async (req, res) => {
  const route = await CollectiveRoute.findByIdAndDelete(req.params.id);
  if (!route) {
    return res.status(404).json({ message: "Ruta no encontrada" });
  }

  res.status(200).json({ message: "Ruta eliminada correctamente" });
});

module.exports.listAvailableRiders = asyncHandler(async (req, res) => {
  const riders = await riderModel.find({ blocked: false }).select(
    "fullname phone vehicle location status"
  );

  res.status(200).json({ riders });
});

module.exports.listPublicRoutes = asyncHandler(async (req, res) => {
  const routes = await CollectiveRoute.find({ isActive: true })
    .populate("assignedRiders", "fullname phone vehicle location status blocked")
    .sort({ name: 1 });

  res.status(200).json({ routes: routes.map(serializeRoute) });
});

module.exports.getPublicRouteDetails = asyncHandler(async (req, res) => {
  const route = await CollectiveRoute.findOne({ _id: req.params.id, isActive: true }).populate(
    "assignedRiders",
    "fullname phone vehicle location status blocked"
  );

  if (!route) {
    return res.status(404).json({ message: "Ruta no encontrada" });
  }

  res.status(200).json({ route: serializeRoute(route) });
});
