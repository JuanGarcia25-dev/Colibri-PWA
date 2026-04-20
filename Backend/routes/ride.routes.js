const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const rideController = require('../controllers/ride.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/chat-details/:id', rideController.chatDetails)
router.get('/share-details/:id', rideController.getShareDetails)

router.post('/create',
    authMiddleware.authUser,
    body('pickup').isString().isLength({ min: 3 }).withMessage('Invalid pickup address'),
    body('destination').isString().isLength({ min: 3 }).withMessage('Invalid destination address'),
    body('vehicleType').isString().isIn([ 'car', 'truck' ]).withMessage('Invalid vehicle type'),
    rideController.createRide
)

router.get('/get-fare',
    authMiddleware.authUser,
    query('pickup').isString().isLength({ min: 3 }).withMessage('Invalid pickup address'),
    query('destination').isString().isLength({ min: 3 }).withMessage('Invalid destination address'),
    rideController.getFare
)

router.post('/confirm',
    authMiddleware.authRider,
    body('rideId').isMongoId().withMessage('Invalid ride id'),
    rideController.confirmRide
)


router.post('/cancel',
    authMiddleware.authUserOrRider,
    body('rideId').isMongoId().withMessage('Invalid ride id'),
    body('reason').optional().isString().isLength({ max: 300 }).withMessage('Invalid cancel reason'),
    rideController.cancelRide
)


router.get('/start-ride',
    authMiddleware.authRider,
    query('rideId').isMongoId().withMessage('Invalid ride id'),
    query('otp').isString().isLength({ min: 6, max: 6 }).withMessage('Invalid OTP'),
    rideController.startRide
)

router.post('/end-ride',
    authMiddleware.authRider,
    body('rideId').isMongoId().withMessage('Invalid ride id'),
    rideController.endRide
)

router.post('/mark-paid',
    authMiddleware.authUser,
    body('rideId').isMongoId().withMessage('Invalid ride id'),
    rideController.markUserPaid
)

router.post('/confirm-payment',
    authMiddleware.authRider,
    body('rideId').isMongoId().withMessage('Invalid ride id'),
    rideController.confirmPayment
)


module.exports = router;
