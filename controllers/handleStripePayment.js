const express = require("express");
const asyncHandler = require("express-async-handler");
const Payment = require("../model/Payment");
const User = require("../model/User");
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

//Basic and Premium subscription plan
const handlePaymentsVerification = asyncHandler(async (req, res) => {
  //fetch the paymentId given by stripe
  const { paymentIntentId } = req.params;
  //check whethere the user is registered or not
  const userId = req.body.id;
  try {
    console.log(
      `Verifying payment for user ${userId} with payment intent ${paymentIntentId}`
    );
    const user = await User.findById(userId);

    if (!user) {
      console.log(`User not found with ID ${userId}`);
      res.status(404).json({
        message: "User not found",
      });
      return;
    }
    console.log(`User found: ${user.name}`);

    //if user is registered, then retrieve payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log(`Payment intent retrieved: ${paymentIntent.id}`);

    //create a new payment record
    const payment = await Payment.create({
      user: user._id,
      subscriptionPlan: paymentIntent.metadata.subscriptionPlan,
      amount: paymentIntent.amount / 100,
      status: paymentIntent.status,
      reference: paymentIntent.id,
      currency: paymentIntent.currency,
    });
    console.log(`Payment record created: ${payment._id}`);

    //update the user subscription plan
    let updatedUser;
    if (user.subscriptionPlan === "Basic") {
      console.log(
        `Updating subscription plan for user ${userId} from Basic to ${paymentIntent.metadata.subscriptionPlan}`
      );
      updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          subscriptionPlan: paymentIntent.metadata.subscriptionPlan,
          // $inc: { renewals: 1 }, // Increment renewal count
          apiRequestCount: 50,
          nextBillingDate: calculateNextBillingDate(),
          $push: { payments: payment._id },
        },
        { new: true }
      );
    } else if (user.subscriptionPlan === "Premium") {
      console.log(
        `Updating subscription plan for user ${userId} from Premium to ${paymentIntent.metadata.subscriptionPlan}`
      );
      updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          subscriptionPlan: paymentIntent.metadata.subscriptionPlan,
          // $inc: { renewals: 1 }, // Increment renewal count
          apiRequestCount: 100,
          nextBillingDate: calculateNextBillingDate(),
          $push: { payments: payment._id },
        },
        { new: true }
      );
    } else {
      console.log(
        `User subscription plan is neither Basic nor Premium: ${user.subscriptionPlan}`
      );
      res.status(400).json({
        message: "Invalid subscription plan",
      });
      return;
    }

    console.log(
      `User subscription plan updated: ${updatedUser.subscriptionPlan}`
    );
    res.status(200).json({
      status: "success",
      message: "Payment verified successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error(`Error verifying payment: ${error.message}`);
    res.status(404).json({
      message: error.message,
    });
  }
});
module.exports = {
  handleStripePayment,
  handleFreemiumRenewal,
  handlePaymentsVerification,
};
