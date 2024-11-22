class FlightSearch {
  constructor(
    user_id,
    source,
    date,
    origin,
    destination,
    year,
    month,
    yearReturn,
    monthReturn,
    bestPrice,
    searchType,
    smilesAndMoney
  ) {
    this.user_id = user_id;
    this.source = source;
    this.date = date;
    this.origin = origin;
    this.destination = destination;
    this.year = year;
    this.month = month;
    this.yearReturn = yearReturn;
    this.monthReturn = monthReturn;
    this.bestPrice = bestPrice;
    this.searchType = searchType;
    this.smilesAndMoney = smilesAndMoney;
  }
}

module.exports = FlightSearch;
