const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../model/User");

const checkAuth = asyncHandler(async (req, res, next) => {
  if (req.cookies.token) {
    const verify = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    req.user = await User.findById(verify.id).select("-password");
    next();
    console.log(verify.id);
  } else {
    res.status(401);
    throw new Error("Not authorized");
  }
});

module.exports = checkAuth;
