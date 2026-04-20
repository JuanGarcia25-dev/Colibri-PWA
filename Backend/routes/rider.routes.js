const express = require("express");
const router = express.Router();
const riderController = require("../controllers/rider.controller");
const { body } = require("express-validator");
const { authRider } = require("../middlewares/auth.middleware");
const { uploadProfilePicture } = require("../config/upload");

router.post("/register",
    body("email").isEmail().isLength({ max: 100 }).withMessage("Invalid Email"),
    body("password")
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$/)
      .withMessage("Password must include uppercase, lowercase, and symbol"),
    body("phone").isLength({ min: 10, max: 10 }).withMessage("Phone Number should be of 10 characters only"),
    body("fullname.firstname").isLength({min:3, max:50}).withMessage("First name must be between 3 and 50 characters long"),
    riderController.registerRider
);

router.post("/verify-email", riderController.verifyEmail);
router.post("/verify-email-otp", authRider, riderController.verifyEmailOtp);

router.post("/login", 
    body("email").isEmail().isLength({ max: 100 }).withMessage("Invalid Email"),
    riderController.loginRider
);

router.post("/update", 
    body("riderData.phone").isLength({ min: 10, max: 10 }).withMessage("Phone Number should be of 10 characters only"),
    body("riderData.fullname.firstname").isLength({min:2, max:50}).withMessage("First name must be between 2 and 50 characters long"),
    authRider,
    riderController.updateRiderProfile
);

router.get("/profile", authRider, riderController.riderProfile);

router.post(
    "/profilephoto",
    authRider,
    uploadProfilePicture.single("profilephoto"),
    riderController.uploadProfilePhoto
);

router.delete(
    "/profilephoto",
    authRider,
    riderController.deleteProfilePhoto
);

router.get("/logout", authRider, riderController.logoutRider);

router.post(
    "/reset-password",
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
    body().custom((value, { req }) => {
        if (req.body.token) return true;
        if (req.body.email && req.body.otp) return true;
        throw new Error("Email and OTP or token are required");
    }),
    riderController.resetPassword
);

module.exports = router;
