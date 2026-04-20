const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { body } = require("express-validator");
const { authUser } = require("../middlewares/auth.middleware");
const { uploadProfilePicture } = require("../config/upload");

router.post("/register",
    body("email").isEmail().isLength({ max: 100 }).withMessage("Invalid Email"),
    body("password")
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$/)
      .withMessage("Password must include uppercase, lowercase, and symbol"),
    body("fullname.firstname").isLength({min:2, max:50}).withMessage("First name must be between 2 and 50 characters long"),
    body("phone").isLength({min:10, max:10}).withMessage("Phone number should be of 10 digits only"),
    userController.registerUser
);

router.post("/verify-email", userController.verifyEmail);
router.post("/verify-email-otp", authUser, userController.verifyEmailOtp);

router.post("/login", 
    body("email").isEmail().isLength({ max: 100 }).withMessage("Invalid Email"),
    userController.loginUser
);

router.post("/update", authUser,
    body("fullname.firstname").isLength({min:2, max:50}).withMessage("First name must be between 2 and 50 characters long"),
    body("fullname.lastname").isLength({min:2, max:50}).withMessage("Last name must be between 2 and 50 characters long"),
    body("phone").isLength({min:10, max:10}).withMessage("Phone number should be of 10 digits only"),
    userController.updateUserProfile
);

router.get("/profile", authUser, userController.userProfile);

router.post(
    "/profilephoto",
    authUser,
    uploadProfilePicture.single("profilephoto"),
    userController.uploadProfilePhoto
);

router.delete(
    "/profilephoto",
    authUser,
    userController.deleteProfilePhoto
);

router.get("/logout", authUser, userController.logoutUser);

router.post(
    "/reset-password",
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
    body().custom((value, { req }) => {
        if (req.body.token) return true;
        if (req.body.email && req.body.otp) return true;
        throw new Error("Email and OTP or token are required");
    }),
    userController.resetPassword
);

module.exports = router;
