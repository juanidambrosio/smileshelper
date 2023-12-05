const regexSingleCitiesOld =
  /(^\w{3})[\s-](\w{3})\s(?:\d{4}[-\/])?([01]\d)(?:\s(\d|\w{3}))?(?:\s(\d|\w{3}))?$/;
const regexSingleCities =
  /(^\w{3})[\s-](\w{3})\s(?:\d{4}[-\/])?([01]\d)(?:\s(\d{1,2}|\w{3}))?(?:\s(\d{1,2}|\w{3}))?(?:\s(\d{1,2})-(\d{1,2}))?$/;
const regexMultipleDestinationMonthlyOld =
  /(^\w{3})[\s|-](\w{4,})\s(?:\d{4}[-\/])?([01]\d)(?:\s(\d|\w{3}))?(?:\s(\d|\w{3}))?$/;
const regexMultipleDestinationMonthly =
    /(^\w{3})[\s|-](\w{4,})\s(?:\d{4}[-\/])?([01]\d)(?:\s(\d{1,2}|\w{3}))?(?:\s(\d{1,2}|\w{3}))?(?:\s(\d{1,2})-(\d{1,2}))?$/;
const regexMultipleOriginMonthlyOld =
    /(^\w{4,})[\s-](\w{3})\s(?:\d{4}[-\/])?([01]\d)(?:\s(\d|\w{3}))?(?:\s(\d|\w{3}))?/;
const regexMultipleOriginMonthly =
    /(^\w{4,})[\s-](\w{3})\s(?:\d{4}[-\/])?([01]\d)(?:\s(\d{1,2}|\w{3}))?(?:\s(\d{1,2}|\w{3}))?(?:\s(\d{1,2})-(\d{1,2}))?$/;

const regexMultipleDestinationFixedDay =
  /^\w{3}(\s|-)\w{4,}\s\d{4}(-|\/)[0-1]\d(-|\/)[0-3]\d(\s(\d|\w{3})){0,2}$/;
const regexMultipleOriginFixedDay =
  /^\w{4,}(\s|-)\w{3}\s\d{4}(-|\/)[0-1]\d(-|\/)[0-3]\d(\s(\d|\w{3})){0,2}$/;

const regexRoundTrip =
  /^\w{3}(\s|-)\w{3}\s\d{4}(-|\/)[0-1]\d(-|\/)[0-3]\d(\s(\d|\w{3})){0,2} \d{4}(-|\/)[0-1]\d(-|\/)[0-3]\d\sm\d(\d)?(\sM\d(\d)?)?(\s(\d|\w{3})){0,2}$/;

const regexFilters =
  /^\/filtros (a:(\w{2}(\s|)){1,10}){0,1}(e:[0-2](\s|)){0,1}(r:\d{1,2}(\s|)){0,1}(pm:\d+(\s|)){0,1}(h:\d{1,2}(\s|)){0,1}(vf(\s|(?!\w))){0,1}(singol(\s|(?!\w))){0,1}(smilesandmoney(\s|(?!\w))){0,1}$/i;

const regexCustomRegion = /^\/nuevaregion (\w{4,})\s((?:\w{3}\s?)+)$/i;

const regexCron = /\/agregarcron\s+([\d\*]+)\s+([\d\*]+)\s+([A-Z\s\d-]+)/;

const regexAlert =  /\/agregaralerta\s+([A-Z\s\d-]+)/;

const regexDeleteAlert =  /\/eliminaralerta\s+([A-Z\s\d-]+)/;

module.exports = {
  regexSingleCities,
  regexMultipleDestinationMonthly,
  regexMultipleDestinationFixedDay,
  regexMultipleOriginMonthly,
  regexMultipleOriginFixedDay,
  regexRoundTrip,
  regexFilters,
  regexCustomRegion,
  regexCron,
  regexAlert,
  regexDeleteAlert
};