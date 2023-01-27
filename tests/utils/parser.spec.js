const {
  preferencesParser,
  generatePayloadRoundTrip,
  generatePayloadMultipleOrigins,
  generatePayloadMultipleDestinations,
  generatePayloadMonthlySingleDestination,
  belongsToCity,
  generateEmissionLink,
  generateEmissionLinkRoundTrip,
} = require('../../utils/parser');
const regions = require('../../data/regions');
const { tripTypes } = require('../../config/constants');

jest.mock('../../config/constants', () => ({
  ...jest.requireActual('../../config/constants'),
  SMILES_EMISSION_URL: 'smilesUrl/',
}));
describe('parser', () => {
  describe('generateEmissionLink', () => {
    it('should return correct emission link', () => {
      const mockedDepartureDate = '2023-03-03';
      expect(
        generateEmissionLink({
          origin: 'EZE',
          destination: 'LHR',
          adults: 3,
          cabinType: 'EJE',
          tripType: tripTypes.ONE_WAY,
          departureDate: mockedDepartureDate,
        })
      ).toBe(
        `smilesUrl/originAirportCode=EZE&destinationAirportCode=LHR&departureDate=${new Date(
          mockedDepartureDate
        ).getTime()}&adults=3&infants=0&children=0&cabinType=BUSINESS&tripType=${
          tripTypes.ONE_WAY
        }`
      );
    });
  });

  describe('generateEmissionLinkRoundTrip', () => {
    it('should return correct emission link', () => {
      const mockedDepartureDate = '2023-03-03';
      const mockedReturnDate = new Date('2023-03-21').getTime();
      expect(
        generateEmissionLinkRoundTrip({
          origin: 'EZE',
          destination: 'LHR',
          adults: 3,
          cabinType: 'EJE',
          tripType: tripTypes.ONE_WAY,
          departureDate: mockedDepartureDate,
          returnDate: mockedReturnDate,
        })
      ).toBe(
        `smilesUrl/originAirportCode=EZE&destinationAirportCode=LHR&departureDate=${new Date(
          mockedDepartureDate
        ).getTime()}&adults=3&infants=0&children=0&cabinType=BUSINESS&tripType=${
          tripTypes.ONE_WAY
        }&returnDate=${mockedReturnDate}`
      );
    });
  });
  describe('belongsToCity', () => {
    it.each([
      ['EZE', 'BUE'],
      ['AEP', 'BUE'],
      ['GIG', 'RIO'],
      ['SDU', 'RIO'],
      ['CFB', 'RIO'],
      ['LHR', 'LON'],
      ['LGW', 'LON'],
      ['LCY', 'LON'],
      ['STN', 'LON'],
      ['FCO', 'ROM'],
      ['GRU', 'SAO'],
      ['CGH', 'SAO'],
      ['CDG', 'PAR'],
      ['ORY', 'PAR'],
    ])('should return true when %s belongs to city %s', (airport, city) => {
      expect(belongsToCity(airport, city)).toBeTruthy();
    });

    it('should return true when airport belongs to city', () => {
      expect(belongsToCity('LHR', 'BUE')).toBeFalsy();
    });
  });
  describe('generatePayloadMonthlySingleDestination', () => {
    it('should generate payload for using a single destination', () => {
      expect(
        generatePayloadMonthlySingleDestination(`EZE MAD 2023-05`)
      ).toEqual({
        destination: 'MAD',
        origin: 'EZE',
        departureDate: '2023-05',
        adults: '',
        cabinType: '',
      });
    });

    it('should generate payload for using a single destination adults and cabin types', () => {
      expect(
        generatePayloadMonthlySingleDestination(`EZE MAD 2023-05 3 EJE`)
      ).toEqual({
        destination: 'MAD',
        origin: 'EZE',
        departureDate: '2023-05',
        adults: '3',
        cabinType: 'EJE',
      });
    });
  });
  describe('generatePayloadMultipleDestinations', () => {
    it('should generate payload when using a region (multiple destinations)', () => {
      const mockedRegion = 'EUROPA';
      const result = generatePayloadMultipleDestinations(
        `EZE ${mockedRegion} 2023-05`
      );

      expect(result).toEqual({
        destination: regions['EUROPA'],
        origin: 'EZE',
        departureDate: '2023-05',
        adults: '',
        cabinType: '',
        region: mockedRegion,
      });
    });

    it('should generate payload when using a region, cabinType and amount of adults', () => {
      const mockedRegion = 'EUROPA';
      const result = generatePayloadMultipleDestinations(
        `EZE ${mockedRegion} 2023-05 EJE 3`
      );

      expect(result).toEqual({
        destination: regions['EUROPA'],
        origin: 'EZE',
        departureDate: '2023-05',
        adults: '3',
        cabinType: 'EJE',
        region: mockedRegion,
      });
    });
  });
  describe('generatePayloadMultipleOrigins', () => {
    it('should generate payload when using a region (multiple origin)', () => {
      const mockedRegion = 'EUROPA';
      const result = generatePayloadMultipleOrigins(
        `${mockedRegion} EZE 2023-05`
      );

      expect(result).toEqual({
        origin: regions['EUROPA'],
        destination: 'EZE',
        departureDate: '2023-05',
        adults: '',
        cabinType: '',
        region: mockedRegion,
      });
    });

    it('should generate payload when using a region, cabinType and amount of adults', () => {
      const mockedRegion = 'EUROPA';
      const result = generatePayloadMultipleOrigins(
        `${mockedRegion} EZE 2023-05 EJE 3`
      );

      expect(result).toEqual({
        origin: regions['EUROPA'],
        destination: 'EZE',
        departureDate: '2023-05',
        adults: '3',
        cabinType: 'EJE',
        region: mockedRegion,
      });
    });
  });
  describe('generatePayloadRoundTrip', () => {
    it('should generate round trip basic payload with min', () => {
      const result = generatePayloadRoundTrip(
        `EZE BCN 2023-03-01 2023-03-30 m7`
      );

      expect(result).toEqual({
        origin: 'EZE',
        destination: 'BCN',
        departureDate: '2023-03-01',
        returnDate: '2023-03-30',
        adultsGoing: '',
        cabinTypeGoing: '',
        adultsComing: '',
        cabinTypeComing: '',
        maxDays: undefined,
        minDays: 7,
      });
    });

    it('should generate round trip basic payload with min days and max days', () => {
      const result = generatePayloadRoundTrip(
        `EZE BCN 2023-03-01 2023-03-30 m7 M14`
      );

      expect(result).toEqual({
        origin: 'EZE',
        destination: 'BCN',
        departureDate: '2023-03-01',
        returnDate: '2023-03-30',
        adultsGoing: '',
        cabinTypeGoing: '',
        adultsComing: '',
        cabinTypeComing: '',
        maxDays: 14,
        minDays: 7,
      });
    });

    it('should generate round trip basic payload cabin types and amount of people', () => {
      const result = generatePayloadRoundTrip(
        `EZE BCN 2023-03-01 EJE 2 2023-03-30 m7 ECO 3`
      );

      expect(result).toEqual({
        origin: 'EZE',
        destination: 'BCN',
        departureDate: '2023-03-01',
        returnDate: '2023-03-30',
        adultsGoing: '2',
        cabinTypeGoing: 'EJE',
        adultsComing: '3',
        cabinTypeComing: 'ECO',
        maxDays: undefined,
        minDays: 7,
      });
    });
  });
  describe('preferencesParse', () => {
    it('should return empty object if no parameters detected on msg str', () => {
      expect(preferencesParser('', {})).toEqual({});
    });

    it('should parse stops preference', () => {
      expect(preferencesParser('filtros e:3', {})).toEqual({ stops: '3' });
    });

    it('should parse max results preference', () => {
      expect(preferencesParser('filtros r:12', {})).toEqual({
        maxresults: '12',
      });
    });

    it('should parse max hours preference', () => {
      expect(preferencesParser('filtros h:12', {})).toEqual({ maxhours: '12' });
    });

    it('should parse brasilNonGol preference', () => {
      expect(preferencesParser('filtros singol', {})).toEqual({
        brasilNonGol: true,
      });
    });

    it('should parse viajefacil preference', () => {
      expect(preferencesParser('filtros vf', { previousfare: false })).toEqual({
        fare: true,
      });

      expect(preferencesParser('filtros vf', { previousfare: true })).toEqual({
        fare: false,
      });
    });

    it('should parse smilesandmoney preference', () => {
      expect(
        preferencesParser('filtros smilesandmoney', { previousfare: false })
      ).toEqual({
        smilesAndMoney: true,
      });

      expect(
        preferencesParser('filtros smilesandmoney', {
          previousSmilesAndMoney: true,
        })
      ).toEqual({
        smilesAndMoney: false,
      });
    });

    it('should parse airlines preference', () => {
      expect(preferencesParser('filtros a:AM', {})).toEqual({
        airlines: ['AM'],
      });

      expect(preferencesParser('filtros a:AM ET AT', {})).toEqual({
        airlines: ['AM', 'ET', 'AT'],
      });
    });

    it('should parse multiple preferences ', () => {
      expect(preferencesParser('filtros a:AV ET e:1 r:30 vf', {})).toEqual({
        airlines: ['AV', 'ET'],
        stops: '1',
        maxresults: '30',
        fare: true,
      });
    });
  });
});
