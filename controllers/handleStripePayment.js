const asyncHandler = require("express-async-handler");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../model/User");
const Payment = require("../model/Payment");

// Utility function to calculate the next billing date
const calculateNextBillingDate = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date;
};

// Validate subscription plan
const validPlans = ["Trial", "Free", "Basic", "Premium"];

const handleStripePayment = asyncHandler(async (req, res) => {
  const { amount, subscriptionPlan } = req.body;
  const user = req?.user;

  if (!validPlans.includes(subscriptionPlan)) {
    return res.status(400).json({
      message: "Invalid subscription plan in request",
    });
  }

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
    console.error(`Stripe payment creation error: ${error.message}`);
    res.status(500).json({
      message: error.message,
    });
  }
});

const handlePaymentsVerification = asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.params;
  const userId = req.body.id;

  try {
    console.log(
      `Verifying payment for user ${userId} with payment intent ${paymentIntentId}`
    );
    const user = await User.findById(userId);

    if (!user) {
      console.log(`User not found with ID ${userId}`);
      return res.status(404).json({
        message: "User not found",
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log(`Retrieved payment intent:`, paymentIntent);

    const subscriptionPlan = paymentIntent.metadata.subscriptionPlan;

    if (!validPlans.includes(subscriptionPlan)) {
      return res.status(400).json({
        message: `Invalid subscription plan in payment intent metadata: ${subscriptionPlan}`,
      });
    }

    // Create a payment record
    const payment = await Payment.create({
      user: user._id,
      subscriptionPlan,
      amount: paymentIntent.amount / 100,
      status: paymentIntent.status,
      reference: paymentIntent.id,
      currency: paymentIntent.currency,
    });
    console.log(`Payment record created: ${payment._id}`);

    // Update user subscription
    const updateData = {
      subscriptionPlan,
      apiRequestCount: subscriptionPlan === "Premium" ? 100 : 50,
      nextBillingDate: calculateNextBillingDate(),
      $push: { payments: payment._id },
    };

    const updatedUser = await User.findByIdAndUpdate(user._id, updateData, {
      new: true,
    });
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
    res.status(500).json({
      message: error.message,
    });
  }
});

const handleFreemiumRenewal = asyncHandler(async (req, res) => {
  const user = req?.user;

  if (new Date(user.nextBillingDate) > new Date()) {
    console.log(`Renewal not due for user: ${user._id}`);
    return res.status(400).json({ message: "Your renewal is not due yet." });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        subscriptionPlan: "Free",
        apiRequestCount: 50,
        nextBillingDate: calculateNextBillingDate(),
      },
      { new: true }
    );

    const paymentRecord = await Payment.create({
      user: user._id,
      subscriptionPlan: "Free",
      amount: 0,
      status: "success",
      reference: "free-renewal",
      currency: "usd",
    });

    updatedUser.payments.push(paymentRecord._id);
    await updatedUser.save();

    console.log(`Freemium plan renewed for user: ${user._id}`);
    res.json({
      status: "success",
      message: "Freemium plan renewed successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error(`Error during freemium renewal: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

module.exports = {
  handleStripePayment,
  handlePaymentsVerification,
  handleFreemiumRenewal,
};
