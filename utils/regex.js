const regexSingleCities = /^\w{3}\s\w{3}\s\d{4}(-|\/)(0|1)\d(\s(\d|\w{3})){0,2}$/;
const regexMultipleDestinationMonthly =
  /^\w{3}\s\w{4,9}\s\d{4}(-|\/)[0-1]\d(\s(\d|\w{3})){0,2}$/;
const regexMultipleDestinationFixedDay =
  /^\w{3}\s\w{4,9}\s\d{4}(-|\/)[0-1]\d(-|\/)[0-3]\d(\s(\d|\w{3})){0,2}$/;
const regexMultipleOriginMonthly =
  /^\w{4,9}\s\w{3}\s\d{4}(-|\/)[0-1]\d(\s(\d|\w{3})){0,2}$/;
const regexMultipleOriginFixedDay =
  /^\w{4,9}\s\w{3}\s\d{4}(-|\/)[0-1]\d(-|\/)[0-3]\d(\s(\d|\w{3})){0,2}$/;

module.exports = {
  regexSingleCities,
  regexMultipleDestinationMonthly,
  regexMultipleDestinationFixedDay,
  regexMultipleOriginMonthly,
  regexMultipleOriginFixedDay,
};
