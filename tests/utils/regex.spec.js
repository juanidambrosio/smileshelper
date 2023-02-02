const {
  regexSingleCities,
  regexMultipleDestinationMonthly,
} = require('../../utils/regex');

describe('Regex Utils', () => {
  describe('regexSingleCities', () => {
    it('should validate correctly a simple search', () => {
      expect(regexSingleCities.test('EZE LON 2023-12')).toBeTruthy();
    });

    it('should validate correctly a simple search with adults only', () => {
        expect(regexSingleCities.test('EZE LON 2023-12 3')).toBeTruthy();
      });
    it('should validate correctly a simple search with cabin type only', () => {
      expect(regexSingleCities.test('EZE LON 2023-12 ECO')).toBeTruthy();
    });

    it('should validate correctly a simple search with cabin type and amount of travellers', () => {
        expect(regexSingleCities.test('EZE LON 2023-12 ECO 3')).toBeTruthy();
        expect(regexSingleCities.test('EZE LON 2023-12 3 ECO')).toBeTruthy();
      });

    it('should reject wrong entries', () => {
      expect(regexSingleCities.test('EZE2 LON 2023-12')).toBeFalsy();
      expect(regexSingleCities.test('EZE2 LON 2023-12-12')).toBeFalsy();
    });
  });

  describe('regexMultipleDestinationMonthly', () => {
    it('should validate correctly a region search', () => {
      expect(
        regexMultipleDestinationMonthly.test('EZE EUROPA 2023-12')
      ).toBeTruthy();
    });

    it('should validate correctly a region search with cabin type', () => {
      expect(
        regexMultipleDestinationMonthly.test('EZE EUROPA 2023-12 ECO')
      ).toBeTruthy();
    });
    
  });
});
