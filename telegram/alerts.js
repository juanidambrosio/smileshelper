const schedule = require("node-schedule");
const { sendToSqs } = require("../aws/sqs/sender.js");
const { aws } = require("../config/config.js");
const { flights } = require("../data/alertFlights.js");

const rule = new schedule.RecurrenceRule();
rule.hour = [12, 22];
rule.minute = 0;

const checkDailyAlerts = async () => {
  schedule.scheduleJob(rule, async () => {
    console.log("Triggering alerts...");
    for (const flight of flights) {
      const text = { journey: flight.journey, promoMiles: flight.promoMiles };
      await sendToSqs(text, aws.queueUrl);
    }
  });
};

module.exports = { checkDailyAlerts };
