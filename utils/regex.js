const regexSingleCities =
  /^\w{3}(\s|-)\w{3}\s\d{4}(-|\/)(0|1)\d(\s(\d|\w{3})){0,2}$/;
const regexMultipleDestinationMonthly =
  /^\w{3}(\s|-)\w{4,9}\s\d{4}(-|\/)[0-1]\d(\s(\d|\w{3})){0,2}$/;
const regexMultipleDestinationFixedDay =
  /^\w{3}(\s|-)\w{4,9}\s\d{4}(-|\/)[0-1]\d(-|\/)[0-3]\d(\s(\d|\w{3})){0,2}$/;
const regexMultipleOriginMonthly =
  /^\w{4,9}(\s|-)\w{3}\s\d{4}(-|\/)[0-1]\d(\s(\d|\w{3})){0,2}$/;
const regexMultipleOriginFixedDay =
  /^\w{4,9}(\s|-)\w{3}\s\d{4}(-|\/)[0-1]\d(-|\/)[0-3]\d(\s(\d|\w{3})){0,2}$/;

const regexRoundTrip =
  /^\w{3}(\s|-)\w{3}\s\d{4}(-|\/)[0-1]\d(-|\/)[0-3]\d(\s(\d|\w{3})){0,2} \d{4}(-|\/)[0-1]\d(-|\/)[0-3]\d\sm\d(\d)?(\sM\d(\d)?)?(\s(\d|\w{3})){0,2}$/;

const regexAirlines =
  /^\/parametros ((a:((\w{2}(\s|)){0,10})){0,1})((e:(\d)){0,1})$/i;

module.exports = {
  regexSingleCities,
  regexMultipleDestinationMonthly,
  regexMultipleDestinationFixedDay,
  regexMultipleOriginMonthly,
  regexMultipleOriginFixedDay,
  regexRoundTrip,
  regexAirlines,
};
