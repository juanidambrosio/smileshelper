class FlightSearch {
  constructor(
    author_id,
    source,
    date,
    origin,
    destination,
    year,
    month,
    bestPrice
  ) {
    this.author_id = author_id;
    this.source = source;
    this.date = date;
    this.origin = origin;
    this.destination = destination;
    this.year = year;
    this.month = month;
    this.bestPrice = bestPrice;
  }
}

module.exports = FlightSearch;
