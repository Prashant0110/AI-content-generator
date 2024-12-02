const express = require("express");
const checkAuthMiddleware = require("../middlewares/Authentication");
const { openAIController } = require("../controllers/openAIController");
const checkApiLimit = require("../middlewares/ApiLimit");
const openAiRouter = express.Router();

openAiRouter.post(
  "/generate",
  checkAuthMiddleware,
  checkApiLimit,
  openAIController
);

module.exports = openAiRouter;
