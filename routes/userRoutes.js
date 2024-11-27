const express = require("express");
const checkAuthMiddleware = require("../middlewares/Authentication");

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
userRouter.post("/logout", checkAuthMiddleware, logout);
userRouter.get("/profile", checkAuthMiddleware, userProfile);

module.exports = userRouter;
