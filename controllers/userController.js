const bcrypt = require("bcryptjs");
const User = require("../model/user");
const asyncHandler = require("express-async-handler");
const model = require("../model/user");
const jwt = require("jsonwebtoken");

//------Registration-----
const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  //Validate
  if (!username || !email || !password) {
    res.status(400);
    throw new Error("Please all fields are required");
  }
  //Check the email is taken
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }
  //Hash the user password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  //create the user
  const newUser = new User({
    username,
    password: hashedPassword,
    email,
  });

  //Add the date the trial will end
  const trialPeriod = User.schema.obj.trialPeriod.default;
  newUser.trialExpires = new Date(Date.now() + trialPeriod * 86400000);
  console.log(newUser.trialExpires);

  await newUser.save();
  res.status(200).json({
    message: "User created successfully",
    username,
    email,
  });
});
//------Login---------
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  //check for user email
  const user = await User.findOne({ email });
  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }
  //check if password is valid
  const isMatch = await bcrypt.compare(password, user?.password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid email or password");
  }
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });
  console.log(userId);
  res.status(200).json({
    message: "Login Successful",
    token,

    id: user._id,
    email: user.email,
    username: user.username,
  });
});

//logout

module.exports = {
  register,
  login,
};
