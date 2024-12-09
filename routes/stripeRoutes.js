const express = require("express");
const checkAuthMiddleware = require("../middlewares/Authentication");
const handleStripePayment = require("../controllers/handleStripePayment");

const stripeRouter = express.Router();

stripeRouter.post(
  "/stripePayment",
  checkAuthMiddleware,

  handleStripePayment.handleStripePayment
);

stripeRouter.post(
  "/freemium-renewal",
  checkAuthMiddleware,
  handleStripePayment.handleFreemiumRenewal
);

stripeRouter.post(
  "/subscription/:paymentIntentId",
  checkAuthMiddleware,
  handleStripePayment.handlePaymentsVerification
);
stripeRouter.post(
  "/subscription/:paymentIntentId",
  checkAuthMiddleware,
  handleStripePayment.handlePaymentsVerification
);
module.exports = stripeRouter;
