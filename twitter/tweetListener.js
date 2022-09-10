const { TwitterApi, ETwitterStreamEvent } = require("twitter-api-v2");
const FlightSearch = require("../models/FlightSearch");
const { default: axios } = require("axios");
const { responseTweetUrl } = require("../config/config");
const dbOperations = require("../db/operations");
const dotenv = require("dotenv").config();
const {
  generatePayloadMonthlySingleDestination,
  generatePayloadMultipleDestinations,
  generatePayloadMultipleOrigins,
} = require("../utils/parser");
const { TWITTER_OWN_ID } = require("../config/constants");

const {
  regexSingleCities,
  regexMultipleDestinationMonthly,
  regexMultipleOriginMonthly,
} = require("../utils/regex");

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

    const regex = new RegExp(regexSingleCities);

    const regexRegionDestination = new RegExp(regexMultipleDestinationMonthly);

    const regexRegionOrigin = new RegExp(regexMultipleOriginMonthly);

    stream.on(ETwitterStreamEvent.Data, async (tweet) => {
      if (tweet.data.author_id === TWITTER_OWN_ID) {
        return;
      }
      try {
        const { id, text } = tweet.data;
        const trimmedText = text.replace("@smileshelper", "").trimStart();
        if (
          !regex.test(trimmedText) &&
          !regexRegionDestination.test(trimmedText) &&
          !regexMultipleOriginMonthly.test(trimmedText)
        ) {
          return;
        }
        console.log(trimmedText);
        let payload = undefined;
        if (regex.test(trimmedText)) {
          payload = generatePayloadMonthlySingleDestination(trimmedText);
        }

        if (regexRegionDestination.test(trimmedText)) {
          payload = generatePayloadMultipleDestinations(trimmedText);
        }

        if (regexRegionOrigin.test(trimmedText)) {
          payload = generatePayloadMultipleOrigins(trimmedText);
        }

        const { data } = await lambdaClient.post("/response", {
          id,
          payload,
        });
        const flightSearch = new FlightSearch(
          tweet.data.author_id,
          "twitter",
          new Date(),
          Array.isArray(payload.origin) ? payload.region : payload.origin,
          Array.isArray(payload.destination.name)
            ? payload.region
            : payload.destination.name,
          payload.destination.departureDate.substring(0, 4),
          payload.destination.departureDate.substring(5, 7),
          data.bestPrice
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
