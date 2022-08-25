const { TwitterApi, ETwitterStreamEvent } = require("twitter-api-v2");
const FlightSearch = require("../models/FlightSearch");
const { default: axios } = require("axios");
const { responseTweetUrl } = require("../config/config");
const dbOperations = require("../db/operations");
const dotenv = require("dotenv").config();
const { calculateIndex } = require("../utils/parser");
const { TWITTER_OWN_ID } = require("../config/constants");

const lambdaClient = axios.create({
  baseURL: responseTweetUrl,
});

const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN).v2;

const listen = async () => {
  try {
    const { createOne } = await dbOperations("flight_search");

    await twitterClient.updateStreamRules({
      add: [{ value: "to:smileshelper", tag: "Reply to Smiles bot" }],
    });

    const stream = await twitterClient.searchStream({
      "tweet.fields": ["author_id"],
    });
    stream.keepAliveTimeoutMs = Infinity;
    stream.autoReconnect = true;

    const regex = new RegExp(/\w{6}(2022|2023|2024)(-|\/)(0|1)\d/);

    stream.on(ETwitterStreamEvent.Data, async (tweet) => {
      if (
        tweet.data.author_id === TWITTER_OWN_ID ||
        ![29, 31, 33, 35].includes(tweet.data.text.length)
      ) {
        return;
      }
      try {
        const { id, text } = tweet.data;
        const trimmedText = text
          .replace(/\s/g, "")
          .replace("@smileshelper", "");
        console.log(trimmedText);
        let payload = undefined;
        if (regex.test(trimmedText)) {
          const { adults, cabinType } = calculateIndex(
            trimmedText.substring(13)
          );
          payload = {
            origin: trimmedText.substring(0, 3).toUpperCase(),
            destination: {
              name: trimmedText.substring(3, 6).toUpperCase(),
              departureYearMonth: trimmedText.substring(6, 13),
            },
            adults: adults ? trimmedText.substring(adults, adults + 1) : "",
            cabinType: cabinType
              ? trimmedText.substring(cabinType, cabinType + 3).toUpperCase()
              : "",
          };
        }
        await lambdaClient.post("/response", { id, payload });
        const flightSearch = new FlightSearch(
          tweet.data.author_id,
          "twitter",
          new Date(),
          payload.origin,
          payload.destination.name,
          payload.destination.departureYearMonth.substring(0, 4),
          payload.destination.departureYearMonth.substring(5)
        );
        await createOne(flightSearch);
      } catch (error) {
        console.log("Reply was not successful: " + error.message);
      }
    });
  } catch (error) {
    console.log("Couldnt connect to stream: " + error.message);
  }
};

listen();
