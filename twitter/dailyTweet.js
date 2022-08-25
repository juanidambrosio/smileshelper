const { twitterClient } = require("../config/config");
const { dailyTweet } = require("./constants.js");

module.exports.tweet = async (event) => {
  try {
    const tweet = await twitterClient.tweet(dailyTweet);
    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: tweet,
        },
        null,
        2
      ),
    };
  } catch (error) {
    return {
      statusCode: error.statusCode,
      body: JSON.stringify("Could not send the tweet. " + error.message),
      // TODO: Reschedule tweet
    };
  }
};
