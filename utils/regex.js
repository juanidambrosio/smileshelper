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
  /^\/filtros (a:(\w{2}(\s|)){1,10}){0,1}(e:[0-2](\s|)){0,1}(r:\d{1,2}){0,1}$/i;

module.exports = {
  regexSingleCities,
  regexMultipleDestinationMonthly,
  regexMultipleDestinationFixedDay,
  regexMultipleOriginMonthly,
  regexMultipleOriginFixedDay,
  regexRoundTrip,
  regexAirlines,
};
