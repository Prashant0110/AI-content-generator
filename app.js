const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv").config();
const userRouter = require("./routes/userRoutes");
const openAiRouter = require("./routes/openAiRouter");
const stripeRouter = require("./routes/stripeRoutes");

const PORT = process.env.PORT || 6000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.error("Database connection error:", err.message);
  });

// Routes
app.use("/", userRouter);
app.use("/", stripeRouter);
app.use("/api/v1/openai", openAiRouter);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
