const schedule = require("node-schedule");
const { from, chat, texts } = require("../data/alertFlights");
const { searchCityQuery } = require("./search");
const { groupChatIdAlerts } = require("../config/constants");

const rule = new schedule.RecurrenceRule();
rule.hour = new schedule.Range(11, 23, 12);

const checkDailyAlerts = async (bot) => {
  schedule.scheduleJob(rule, async () => {
    for (const text of texts) {
      try {
        const { bestFlight, response } = await searchCityQuery({
          from,
          chat,
          text: text.journey,
          promoMiles: text.promoMiles,
        });
        console.log(bestFlight.price + " " + new Date().toISOString());
        if (bestFlight.price <= text.promoMiles) {
          bot.sendMessage(
            groupChatIdAlerts,
            `ALERTA! Se encontró un tramo en promoción:\n ${response}`,
            { parse_mode: "Markdown" }
          );
        }
      } catch (error) {
        console.log(`Couldnt obtain result for alert query ${text.journey}`);
      }
    }
  });
};

module.exports = { checkDailyAlerts };
