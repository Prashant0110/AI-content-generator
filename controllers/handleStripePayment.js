const express = require("express");
const asyncHandler = require("express-async-handler");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
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

// Function to handle Freemium Plan Renewal
const handleFreemiumRenewal = asyncHandler(async (req, res) => {
  const user = req.user; // Get the logged-in user

  // Check if the user's subscription is due for renewal
  if (!checkIfRenewalDue(user)) {
    return res.status(400).json({ message: "Your renewal is not due yet." });
  }

  // Update user's subscription details using findByIdAndUpdate
  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    {
      subscriptionPlan: "Free", // Ensure it's the free plan
      $inc: { renewals: 1 }, // Increment renewal count
      apiRequestCount: 5, // Reset API request count for free plan
      nextBillingDate: calculateNextBillingDate(), // Set next billing date
    },
    { new: true } // Return the updated document
  );

  // Record the freemium "payment" (no monetary value)
  const paymentRecord = await Payment.create({
    user: user._id,
    subscriptionPlan: "Free",
    amount: 0,
    status: "success",
    reference: "free-renewal",
    currency: "usd",
  });

  // Add the payment record to the user's payments array
  updatedUser.payments.push(paymentRecord._id);
  await updatedUser.save();

  res.json({
    status: "success",
    message: "Freemium plan renewed successfully.",
    user: updatedUser,
  });
});
module.exports = {
  handleStripePayment,
  handleFreemiumRenewal,
};
