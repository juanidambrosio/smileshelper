const padMonth = someMonth => {
  if (someMonth >= 10) return String(someMonth);
  return `0${someMonth}`;
}

module.exports = { padMonth };