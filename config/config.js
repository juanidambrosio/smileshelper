const dotenv = require("dotenv");
dotenv.config();

const maxResults = process.env.MAX_RESULTS || 10;

const smiles = {
  authorizationToken:
    process.env.SMILES_AUTH_TOKEN ||
    "AHspTPDZ5YPWlYKNjD73SYe2QdsSD1E9IMibwMNwUM16V0Gjo2tEx9",
  apiKey:
    process.env.SMILES_API_KEY || "aJqPU7xNHl9qN3NVZnPaJ208aPo2Bh2p2ZV844tw",
  milePrice: process.env.SMILES_MILE_PRICE,
};

const telegramApiToken = process.env.TELEGRAM_API_TOKEN;
const telegramAlertsApiToken = process.env.TELEGRAM_ALERTS_API_TOKEN;

const aws = {
  queueUrl: process.env.SQS_QUEUE_URL,
  journeysCount: process.env.JOURNEYS_COUNT
};

module.exports = {
  maxResults,
  smiles,
  aws,
  telegramApiToken,
  telegramAlertsApiToken,
};
