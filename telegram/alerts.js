const schedule = require("node-schedule");
const { from, chat, texts } = require("../data/alertFlights");
const { searchCityQuery } = require("./search");

const checkDailyAlerts = async (bot) => {
  schedule.scheduleJob(process.env.ALERTS_FREQUENCY, async () => {
    for (const text of texts) {
      try {
        const { bestFlight, response } = await searchCityQuery({
          from,
          chat,
          text,
        });
        console.log(bestFlight.price);
      } catch (error) {
        console.log(`Couldnt obtain result for alert query ${text}`);
      }
      //bot.sendMessage(groupChatIdAlerts, "Alert Test!");
    }
  });
};

module.exports = { checkDailyAlerts };
