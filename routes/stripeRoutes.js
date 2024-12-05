const express = require("express");
const checkAuthMiddleware = require("../middlewares/Authentication");
const handleStripePayment = require("../controllers/handleStripePayment");

const stripeRouter = express.Router();

stripeRouter.post(
  "/stripePayment",
  checkAuthMiddleware,

  handleStripePayment
);

module.exports = stripeRouter;
