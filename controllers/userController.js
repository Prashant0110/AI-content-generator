const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../model/User");

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create new user
  const user = await User.create({
    username,
    email,
    password: hashedPassword,
  });

  // Generate token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  res.status(201).json({
    message: "User created",
    token,
    id: user._id,
    email: user.email,
    name: user.name,
  });
});

// @desc    Login a user
// @route   POST /api/users/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email });

  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  // Check if password is valid
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  // Generate token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  // Set cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 86400 * 1000, // 1 day
  });

  // Send response
  res.status(200).json({
    message: "Login Successful",
    token,
    id: user._id,
    email: user.email,
    name: user.name,
  });
});

//logout

const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
  });
  res.status(200).json({ message: "Logout successful" });
});

const userProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req?.user?.id)
    .select("-password")
    .populate("payments") //attach payment history
    .populate("contentHistory");
  if (user) {
    res.status(200).json({
      status: "success",
      user,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});
module.exports = { register, login, userProfile, logout };
