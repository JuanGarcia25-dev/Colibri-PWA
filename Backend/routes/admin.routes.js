const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { authAdmin } = require("../middlewares/auth.middleware");
const { body } = require("express-validator");

router.get("/profile", authAdmin, adminController.adminProfile);
router.get(
  "/driver-applications",
  authAdmin,
  adminController.listDriverApplications
);
router.post(
  "/driver-applications/:id/approve",
  authAdmin,
  adminController.approveDriverApplication
);
router.post(
  "/driver-applications/:id/reject",
  authAdmin,
  adminController.rejectDriverApplication
);
router.post(
  "/driver-applications/:id/docs/:docKey/review",
  authAdmin,
  adminController.reviewDocument
);

router.get("/users", authAdmin, adminController.listUsers);
router.post("/users/:id/block", authAdmin, adminController.toggleUserBlock);

router.get("/fares", authAdmin, adminController.getFares);
router.post("/fares", authAdmin, adminController.updateFares);

router.get("/metrics", authAdmin, adminController.getMetrics);

router.get("/doc-url", authAdmin, adminController.getDocumentUrl);

router.post(
  "/reset-password",
  body("email").isEmail().withMessage("Email is required"),
  body("otp").isLength({ min: 6, max: 6 }).withMessage("OTP invalido"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
  adminController.resetPassword
);

module.exports = router;
