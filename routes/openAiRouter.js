const express = require("express");
const checkAuthMiddleware = require("../middlewares/Authentication");
const { openAIController } = require("../controllers/openAIController");
const openAiRouter = express.Router();

openAiRouter.post("/generate", checkAuthMiddleware, openAIController);

module.exports = openAiRouter;
