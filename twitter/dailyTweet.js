const { twitterClient } = require("../config/config");
const { localization } = require("./constants.js");

module.exports.tweet = async (event) => {
  try {
    const tweet = await twitterClient.tweet( localization.ES.dailyTweet);
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
