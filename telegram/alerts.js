const schedule = require("node-schedule");
const { from, chat, texts } = require("../data/alertFlights");
const { searchCityQuery } = require("./search");
const {
  groupChatIdAlerts,
  maxRetriesAlerts,
  delaySecondsRetriesAlerts,
} = require("../config/constants");
const sleep = require("../utils/sleep");
const cliProgress = require("cli-progress");

const rule = new schedule.RecurrenceRule();
rule.hour = [13, 21];
rule.minute = 0;

const journeyAlerts = new Map();
const progressBar = new cliProgress.SingleBar(
  {},
  cliProgress.Presets.shades_classic
);

const checkDailyAlerts = async (bot) => {
  schedule.scheduleJob(rule, async () => {
    let failedRequests = 0;
    progressBar.start(texts.length, 0);
    for (const text of texts) {
      const success = await checkPromoFlight(text);
      progressBar.increment();
      if (!success) {
        console.log(`Couldnt obtain result for alert query ${text.journey}`);
        failedRequests++;
      }
    }
    progressBar.stop();
    console.log(`Failed ${failedRequests} requests`);
    for (const journeyAlert of journeyAlerts.values()) {
      bot.sendMessage(groupChatIdAlerts, journeyAlert, {
        parse_mode: "Markdown",
      });
    }
    journeyAlerts.clear();
  });
};

const checkPromoFlight = async (text, retries = 0) => {
  try {
    const { bestFlight, response } = await searchCityQuery({
      from,
      chat,
      text: text.journeyComplete,
      promoMiles: text.promoMiles,
    });

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
    retries++;
    if (retries <= maxRetriesAlerts) {
      console.log(`Retry ${retries} for ${text.journey}`);
      await sleep(delaySecondsRetriesAlerts);
      return await checkPromoFlight(text, retries);
    } else return false;
  }
};

module.exports = { checkDailyAlerts };
