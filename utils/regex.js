const regexSingleCities =
  /(^\w{3})[\s-](\w{3})\s(?:\d{4}[-\/])?([01]\d)(?:\s(\d|\w{3}))?(?:\s(\d|\w{3}))?$/;
const regexMultipleDestinationMonthly =
  /(^\w{3})[\s-](\w{4,})\s(?:\d{4}[-\/])?([01]\d)(?:\s(\d|\w{3}))?(?:\s(\d|\w{3}))?$/;
const regexMultipleDestinationFixedDay =
  /(^\w{3})[\s-](\w{4,})\s(?:\d{4}[-\/])?([01]\d-[0-3]\d)(?:\s(\d|\w{3}))?(?:\s(\d|\w{3}))?$/;
const regexMultipleOriginMonthly =
  /(^\w{4,})[\s-](\w{3})\s(?:\d{4}[-\/])?([01]\d)(?:\s(\d|\w{3}))?(?:\s(\d|\w{3}))?/;
const regexMultipleOriginFixedDay =
  /(^\w{4,})[\s-](\w{3})\s(?:\d{4}[-\/])?([01]\d-[0-3]\d)(?:\s(\d|\w{3}))?(?:\s(\d|\w{3}))?$/;

const regexRoundTrip =
  /(^\w{3})[\s-](\w{3})\s(\d{4}[-\/][0-1]\d[-\/][0-3]\d) (\d{4}[-\/][0-1]\d[-\/][0-3]\d)\s(m\d{1,2})\s?(M\d{1,2}){0,1}(?:\s(\d|\w{3}))?(?:\s(\d|\w{3}))?$/;

const regexFilters =
  /^\/filtros (a:(\w{2}(\s|)){1,10}){0,1}(e:[0-2](\s|)){0,1}(r:\d{1,2}(\s|)){0,1}(h:\d{1,2}(\s|)){0,1}(vf(\s|(?!\w))){0,1}(singol(\s|(?!\w))){0,1}(smilesandmoney(\s|(?!\w))){0,1}(pm:\d.\d\d(\s|)){0,1}(pd:\d{3}(\s|)){0,1}$/i;

const regexCustomRegion = /^\/nuevaregion (\w{4,})\s((?:\w{3}\s?)+)$/i;

module.exports = {
  regexSingleCities,
  regexMultipleDestinationMonthly,
  regexMultipleDestinationFixedDay,
  regexMultipleOriginMonthly,
  regexMultipleOriginFixedDay,
  regexRoundTrip,
  regexFilters,
  regexCustomRegion,
};
