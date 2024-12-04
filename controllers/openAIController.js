const asyncHandler = require("express-async-handler");
const axios = require("axios");
const ContentHistory = require("../model/ContentHistory");
const User = require("../model/User"); // Import the User model

const openAIController = asyncHandler(async (req, res) => {
  const { prompt } = req.body;
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/completions",
      {
        prompt,
        model: "gpt-3.5-turbo",
        max_tokens: 5,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    // Content creation
    const generatedText = response?.data?.choices[0].text.trim();
    console.log(response.data);

    // Create history
    const history = await ContentHistory.create({
      user: req?.user?._id,
      content: generatedText,
    });

    // Update API request count
    const updatedApiRequestCount = req?.user?.apiRequestCount + 1;
    // Push history to the user document
    const userHistory = await User.findByIdAndUpdate(
      req?.user?._id,
      {
        $push: { contentHistory: history._id },
        apiRequestCount: updatedApiRequestCount,
      },
      { new: true }
    );

    // Respond with success or the user history
    res.status(200).json({ userHistory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
});

module.exports = { openAIController };
