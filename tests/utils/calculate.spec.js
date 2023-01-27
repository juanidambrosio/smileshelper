const { getBestFlight } = require('../../utils/calculate');

const flightMocks = [
  {
    stops: 1,
    fareList: [
      {
        uid: 'uid1',
        type: 'SMILES_CLUB',
        money: 10,
        miles: 15,
        baseMiles: 384000,
        airlineFareAmount: 132076,
        airlineFare: 0,
        airlineTax: 153360.85,
      },
      {
        uid: 'uid2',
        type: 'SMILES_MONEY_CLUB',
        money: 50,
        miles: 500000,
        baseMiles: 384000,
        airlineFareAmount: 132076,
        airlineFare: 0,
        airlineTax: 153360.85,
      },
    ],
  },
  {
    stops: 2,
    fareList: [
      {
        uid: 'uid3',
        type: 'SMILES_CLUB',
        money: 11,
        miles: 16,
        baseMiles: 384000,
        airlineFareAmount: 132076,
        airlineFare: 0,
        airlineTax: 153360.85,
      },
      {
        uid: 'uid4',
        type: 'SMILES_MONEY_CLUB',
        money: 100,
        miles: 384000,
        baseMiles: 384000,
        airlineFareAmount: 132076,
        airlineFare: 0,
        airlineTax: 153360.85,
      },
    ],
  },
];

describe('getBestFlight', () => {
  it('should return empty flight when no flights found', () => {
    const result = getBestFlight({ flightList: [] });

    expect(result).toEqual({
      flight: {},
      price: Number.MAX_VALUE,
    });
  });

  it('should return best flight for smilesAndMoney', () => {
    expect(
      getBestFlight(
        { flightList: flightMocks },
        { cabinType: '' },
        'SMILES_MONEY_CLUB'
      )
    ).toEqual({
      flight: flightMocks[1],
      price: 384000,
      money: 100,
      fareUid: 'uid4',
    });
  });

  it('should return best flight for only smiles', () => {
    expect(
      getBestFlight(
        { flightList: flightMocks },
        { cabinType: '' },
        'SMILES_CLUB'
      )
    ).toEqual({
      flight: flightMocks[0],
      price: 15,
      money: 10,
      fareUid: 'uid1',
    });
  });

  it('should return best flight for smilesAndMoney filtered by preferences', () => {
    expect(
      getBestFlight(
        { flightList: flightMocks },
        { cabinType: '', stops: 1 },
        'SMILES_MONEY_CLUB'
      )
    ).toEqual({
      flight: flightMocks[0],
      price: 500000,
      money: 50,
      fareUid: 'uid2',
    });
  });
});
