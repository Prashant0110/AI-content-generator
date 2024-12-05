const express = require("express");
const asyncHandler = require("express-async-handler");
const stripe = require("stripe")(
  process.env.STRIPE_SECRET_KEY ||
    "sk_test_51QSHuhHCVBXe7H0jV7kWKJIzz7UIHXMlsrU9OYbYNmPWmufjlJcEMew7fL6PtBhbMX5RDAdY0HaGMxpzbdv7pn6s00oiSWfS1v"
);
console.log(process.env.STRIPE_SECRET_KEY);

const handleStripePayment = asyncHandler(async (req, res) => {
  const { amount, subscriptionPlan } = req.body;
  const user = req?.user;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Number(amount) * 100,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        user: user?._id.toString(),
        userEmail: user?.email,
        subscriptionPlan,
      },
    });
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      metadata: paymentIntent.metadata,
      paymentIntent,
    });
  } catch (error) {
    res.status(404).json({
      message: error.message,
    });
  }
});

module.exports = handleStripePayment;
