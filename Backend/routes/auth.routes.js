const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authController = require("../controllers/auth.controller");

router.post(
  "/login",
  body("email").isEmail().withMessage("Invalid Email"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
  authController.loginUnified
);

module.exports = router;
