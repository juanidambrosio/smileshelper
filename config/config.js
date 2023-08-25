const {TwitterApi, ApiResponseError} = require("twitter-api-v2");

const dotenv = require("dotenv");
dotenv.config();

const maxResults = process.env.MAX_RESULTS || 10;

const smiles = {
    authorizationToken: process.env.SMILES_AUTH_TOKEN || [
        'AHspTPDZ5YPWlYKNjD73SYe2QdsSD1E9IMibwMNwUM16V0Gjo2tEx9',
        'NM4SvkQQRy4xyfCDOPfHbID1bmLPQo8BMRUmVLpjGLveqKqhUJxRgL',
        'xCSiLD1cMabeT3x1wzpgQdu05RsR1G32PIM6ijmbMh8lleM7TJ2GMS',
        'FFwHJtP8PqHmvLoNFM22tXajnsgrk9LsXJf79Vb8dY5nE1cryDhaG6',
        'JgKkltHgHCcscGqW5C54Yhje0OiYmLkVJMbtu5gkHKd8XYZ2OZWLBs',
        'P2IEmkORj8HQMOba0fRikZmSSwTcBIrjqUQWqDwBz70FVBhUQ53A6d',
        '5LGskr24z4WToqcmVNLSJSiNyLAeEcNwYh4dyg1xH7geKp8zUqJL39',
        'sPnkZUWia8CNvmcaoi3QWiKn1iV5IrVh5aFfBckV07rT6Kmirkg4an',
        'dXqxIJquj4Yn532UiGsd4XvItoYiQnE4AVRtpcTycHuIsz8Eq0pKk6'
    ],
    apiKey: process.env.SMILES_API_KEY || 'aJqPU7xNHl9qN3NVZnPaJ208aPo2Bh2p2ZV844tw',
    milePrice: process.env.SMILES_MILE_PRICE,
};

const responseTweetUrl = process.env.RESPONSE_TWEET_URL;

const twitterClient = process.env.TWITTER_API_KEY && new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_KEY_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
}).v2;

const telegramApiToken = process.env.TELEGRAM_API_TOKEN

module.exports = {
    maxResults,
    smiles,
    responseTweetUrl,
    twitterClient,
    telegramApiToken,
    ApiResponseError
};
