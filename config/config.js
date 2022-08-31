const { TwitterApi, ApiResponseError } = require("twitter-api-v2");

const dotenv = require("dotenv");
dotenv.config();

const maxResults = process.env.MAX_RESULTS || 10;

const smiles = {
  authorizationToken: process.env.SMILES_AUTH_TOKEN,
  apiKey: process.env.SMILES_API_KEY,
  milePrice: process.env.SMILES_MILE_PRICE,
};

const responseTweetUrl = process.env.RESPONSE_TWEET_URL;

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_KEY_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
}).v2;

const telegramApiToken = process.env.TELEGRAM_API_TOKEN;
const telegramApiTokenBRL = process.env.TELEGRAM_API_TOKEN_BRL;

module.exports = {
  maxResults,
  smiles,
  responseTweetUrl,
  twitterClient,
  telegramApiToken,
  telegramApiTokenBRL,
  ApiResponseError
};
