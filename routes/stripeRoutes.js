const express = require("express");
const checkAuthMiddleware = require("../middlewares/Authentication");
const handleStripePayment = require("../controllers/handleStripePayment");

const stripeRouter = express.Router();

stripeRouter.post(
  "/stripePayment",
  checkAuthMiddleware,

  handleStripePayment
);

stripeRouter.post(
  "/freemium-renewal",
  checkAuthMiddleware,
  handleStripePayment.handleFreemiumRenewal
);

module.exports = stripeRouter;
