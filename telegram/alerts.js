const { groupChatIdAlerts } = require("../config/constants");
const schedule = require("node-schedule");

const checkDailyAlerts = async (bot) => {
  schedule.scheduleJob(process.env.ALERTS_FREQUENCY, async () => {
    bot.sendMessage(groupChatIdAlerts, "Alert Test!");
  });
};

module.exports = { checkDailyAlerts };
