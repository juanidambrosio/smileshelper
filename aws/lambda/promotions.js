const TelegramBot = require("node-telegram-bot-api");
const { telegramAlertsApiToken } = require("../../config/config.js");

const {
  groupChatIdAlerts,
  maxRetriesAlerts,
  delaySecondsRetriesAlerts,
} = require("../../config/constants.js");
const { alertFlightsInput } = require("../../data/alertFlights.js");
const { searchCityQuery } = require("../../handlers/searchHandler.js");
const sleep = require("../../utils/sleep.js");

let bot;

module.exports.getPromotions = async (event) => {
  console.log("Getting best annual offers...");
  if (!bot) {
    bot = new TelegramBot(telegramAlertsApiToken, {
      polling: true,
    });
  } else {
    console.log("Bot already set");
  }
  const checkPromoFlightPromises = [];
  for (const record of event.Records) {
    const { journey, promoMiles } = record.messageAttributes;
    const flights = alertFlightsInput(
      journey.stringValue,
      promoMiles.stringValue
    );
    for (const flight of flights) {
      checkPromoFlightPromises.push(
        checkPromoFlight(
          flight.journey,
          flight.journeyComplete,
          flight.promoMiles
        )
      );
    }
  }
  const responses = await Promise.all(checkPromoFlightPromises);
  let alertMessages = [];
  for (const response of responses) {
    if (response) {
      alertMessages = mapResponse(alertMessages, response);
    }
  }
  for (const alertMessage of alertMessages) {
    bot.sendMessage(groupChatIdAlerts, alertMessage, {
      parse_mode: "Markdown",
    });
  }
};

const mapResponse = (alertMessages, response) => {
  if (alertMessages[0] && alertMessages[0].length + response.length > 9500) {
    alertMessages[1] = alertMessages[1]
      ? alertMessages[1].concat(response)
      : `ALERTA! Resumen anual de tramos en promoción para ${response}`;
    return alertMessages;
  }
  alertMessages[0] = alertMessages[0]
    ? alertMessages[0].concat(response)
    : `ALERTA! Resumen anual de tramos en promoción para ${response}`;
  return alertMessages;
};

const checkPromoFlight = async (
  journey,
  journeyComplete,
  promoMiles,
  retries = 0
) => {
  try {
    const { bestFlight, response } = await searchCityQuery({
      from: { username: "smileshelper" },
      chat: { id: groupChatIdAlerts },
      text: journeyComplete,
      promoMiles: promoMiles,
      isAlert: true,
    });

    return bestFlight &&
      bestFlight.price <= promoMiles &&
      bestFlight.tax.milesNumber < 50000
      ? response
      : "";
  } catch (error) {
    console.log(error);
    retries++;
    if (retries <= maxRetriesAlerts) {
      console.log(`Retry ${retries} for ${journey}`);
      await sleep(delaySecondsRetriesAlerts);
      return await checkPromoFlight(
        journey,
        journeyComplete,
        promoMiles,
        retries
      );
    } else return "";
  }
};
