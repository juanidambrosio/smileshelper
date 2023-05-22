const sendToSqs = async (text, queueUrl) => {
  var { SQS } = require("aws-sdk");

  var sqs = new SQS({ apiVersion: "2012-11-05", region: "us-east-1" });

  var params = {
    // Remove DelaySeconds parameter and value for FIFO queues
    DelaySeconds: 10,
    MessageAttributes: {
      journey: {
        DataType: "String",
        StringValue: text.journey,
      },
      promoMiles: {
        DataType: "Number",
        StringValue: text.promoMiles.toString(),
      },
    },
    MessageBody: `Alerta de promociones`,
    QueueUrl: queueUrl,
  };

  sqs.sendMessage(params, (err, data) => {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success", data.MessageId);
    }
  });
};

module.exports = { sendToSqs };
