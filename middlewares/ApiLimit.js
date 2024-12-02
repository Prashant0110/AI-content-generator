const asyncHandler = require("express-async-handler");
const User = require("../model/User");

const checkApiLimit = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "You are not logged in",
    });
  }
  //logged in --> check api limit-->check trial period--->end-->throw error
  const user = await User.findById(req?.user?.id);
  let apiCount = 0;
  if (user?.remainingTrialDays) {
    apiCount = req?.user?.monthlyRequestCount;
  }

  //checking if limit is exceeded
  if (req?.user?.apiRequestCount >= apiCount) {
    return res.status(400).json({
      message: "You have exceeded your api limit",
    });
  }

  next();
});

module.exports = checkApiLimit;
