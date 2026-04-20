const express = require("express");
const { body } = require("express-validator");
const collectiveRouteController = require("../controllers/collective-route.controller");
const { authAdmin, authUser } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/admin/riders", authAdmin, collectiveRouteController.listAvailableRiders);
router.get("/admin/list", authAdmin, collectiveRouteController.listAdminRoutes);
router.post(
  "/admin",
  authAdmin,
  body("name").isLength({ min: 3 }).withMessage("Nombre invalido"),
  body("origin").custom((value) => {
    if (typeof value === "string" && value.trim().length >= 3) return true;
    if (
      value &&
      typeof value === "object" &&
      typeof value.coordinates?.lat === "number" &&
      typeof value.coordinates?.lng === "number"
    ) {
      return true;
    }
    throw new Error("Origen invalido");
  }),
  body("destination").custom((value) => {
    if (typeof value === "string" && value.trim().length >= 3) return true;
    if (
      value &&
      typeof value === "object" &&
      typeof value.coordinates?.lat === "number" &&
      typeof value.coordinates?.lng === "number"
    ) {
      return true;
    }
    throw new Error("Destino invalido");
  }),
  collectiveRouteController.createRoute
);
router.put(
  "/admin/:id",
  authAdmin,
  body("name").isLength({ min: 3 }).withMessage("Nombre invalido"),
  body("origin").custom((value) => {
    if (typeof value === "string" && value.trim().length >= 3) return true;
    if (
      value &&
      typeof value === "object" &&
      typeof value.coordinates?.lat === "number" &&
      typeof value.coordinates?.lng === "number"
    ) {
      return true;
    }
    throw new Error("Origen invalido");
  }),
  body("destination").custom((value) => {
    if (typeof value === "string" && value.trim().length >= 3) return true;
    if (
      value &&
      typeof value === "object" &&
      typeof value.coordinates?.lat === "number" &&
      typeof value.coordinates?.lng === "number"
    ) {
      return true;
    }
    throw new Error("Destino invalido");
  }),
  collectiveRouteController.updateRoute
);
router.patch("/admin/:id/status", authAdmin, collectiveRouteController.toggleRouteStatus);
router.delete("/admin/:id", authAdmin, collectiveRouteController.deleteRoute);

router.get("/", authUser, collectiveRouteController.listPublicRoutes);
router.get("/:id", authUser, collectiveRouteController.getPublicRouteDetails);

module.exports = router;
