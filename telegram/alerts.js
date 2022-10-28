const { from, chat, texts } = require("../data/alertFlights");
const { searchCityQuery } = require("./search");
const {
  groupChatIdAlerts,
  maxRetriesAlerts,
  delaySecondsRetriesAlerts,
} = require("../config/constants");
const sleep = require("../utils/sleep");
const TelegramBot = require("node-telegram-bot-api");
const { telegramAlertsApiToken } = require("../config/config");
const { initializeDbFunctions } = require("../db/dbFunctions");

const checkPromoFlight = async (text, retries = 0) => {
  try {
    const { bestFlight, response } = await searchCityQuery(
      {
        from,
        chat,
        text: text.journeyComplete,
        promoMiles: text.promoMiles,
      },
      true
    );

    if (bestFlight && bestFlight.price <= text.promoMiles) {
      const journeyCompleteAlert = journeyAlerts.get(text.journey);
      if (
        journeyCompleteAlert &&
        journeyCompleteAlert.length + response.length > 9500
      ) {
        const secondJourneyAlert = journeyAlerts.get(text.journey + "2");
        journeyAlerts.journeyAlerts.set(
          text.journey + "2",
          secondJourneyAlert
            ? secondJourneyAlert.concat(response)
            : `ALERTA! Resumen anual de tramos en promoción para ${response}`
        );
        return true;
      }
      journeyAlerts.set(
        text.journey,
        journeyCompleteAlert
          ? journeyCompleteAlert.concat(response)
          : `ALERTA! Resumen anual de tramos en promoción para ${response}`
      );
    }
    return true;
  } catch (error) {
    console.log(error);
    retries++;
    if (retries <= maxRetriesAlerts) {
      console.log(`Retry ${retries} for ${text.journey}`);
      await sleep(delaySecondsRetriesAlerts);
      return await checkPromoFlight(text, retries);
    } else return false;
  }
};

module.exports.checkDailyAlerts = async () => {
  await initializeDbFunctions();
  let failedRequests = 0;
  const successArray = await Promise.all(checkPromoFlightPromises);
  for (const success of successArray) {
    if (!success) {
      console.log(`Couldnt obtain result for alert query ${text.journey}`);
      failedRequests++;
    }
  }
  console.log(`Failed ${failedRequests} requests`);
  for (const journeyAlert of journeyAlerts.values()) {
    // bot.sendMessage(groupChatIdAlerts, journeyAlert, {
    //   parse_mode: "Markdown",
    // });
    console.log(journeyAlert);
    await sleep(500);
  }
  journeyAlerts.clear();
};

const bot = new TelegramBot(telegramAlertsApiToken, { polling: true });
const journeyAlerts = new Map();

const checkPromoFlightPromises = [];
for (const text of texts) {
  checkPromoFlightPromises.push(checkPromoFlight(text));
}
