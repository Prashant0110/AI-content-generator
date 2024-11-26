const express = require("express");

const {
  register,
  login,
  logout,
  userProfile,
  checkAuth,
} = require("../controllers/userController");

const userRouter = express.Router();

userRouter.post("/register", register);
userRouter.post("/login", login);

module.exports = userRouter;
