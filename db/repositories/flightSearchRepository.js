const FlightSearch = require('../../models/FlightSearch');
const BaseRepository = require('./baseRepository');
class FlightSearchRepository extends BaseRepository {
    constructor() {
        super('flight_search');
    }

    async createSearchFlight(data) {
        const {
            id,
            origin,
            destination,
            departureDate,
            returnDate,
            price,
            searchType,
            smilesAndMoney,
        } = data;

        const flightSearch = new FlightSearch(
            id,
            'telegram',
            new Date(),
            origin,
            destination,
            departureDate.substring(0, 4),
            departureDate.substring(5, 7),
            returnDate ? returnDate.substring(0, 4) : undefined,
            returnDate ? returnDate.substring(5, 7) : undefined,
            price,
            searchType,
            smilesAndMoney
        );

        const collection = await this.connect();
        return await collection.insertOne(flightSearch);
    }
}

module.exports = new FlightSearchRepository();