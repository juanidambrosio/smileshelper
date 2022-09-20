const schedule = require("node-schedule");
const { from, chat, texts } = require("../data/alertFlights");
const { searchCityQuery } = require("./search");
const { groupChatIdAlerts } = require("../config/constants");

const rule = new schedule.RecurrenceRule();
rule.hour = [14, 22];

const checkDailyAlerts = async (bot) => {
  schedule.scheduleJob(rule, async () => {
    const journeyAlerts = new Map();
    for (const text of texts) {
      try {
        const { bestFlight, response } = await searchCityQuery({
          from,
          chat,
          text: text.journeyComplete,
          promoMiles: text.promoMiles,
        });

        if (bestFlight.price <= text.promoMiles) {
          const journeyCompleteAlert = journeyAlerts.get(text.journey);
          journeyAlerts.set(
            text.journey,
            journeyCompleteAlert
              ? journeyCompleteAlert.concat(response)
              : `ALERTA! Resumen anual de tramos en promoción para ${response}`
          );
        }
      } catch (error) {
        console.log(`Couldnt obtain result for alert query ${text.journey}`);
      }
    }
    for (const journeyAlert of journeyAlerts.values()) {
      bot.sendMessage(groupChatIdAlerts, journeyAlert, {
        parse_mode: "Markdown",
      });
    }
  });
};

module.exports = { checkDailyAlerts };
