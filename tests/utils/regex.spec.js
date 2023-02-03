const {
  regexSingleCities,
  regexMultipleDestinationMonthly,
  regexMultipleDestinationFixedDay,
  regexMultipleOriginMonthly,
  regexMultipleOriginFixedDay,
  regexRoundTrip,
  regexFilters,
  regexCustomRegion,
} = require("../../utils/regex");

describe("Regex Utils", () => {
  describe("regexSingleCities", () => {
    it("should validate correctly a simple search", () => {
      expect(regexSingleCities.test("EZE LON 2023-12")).toBeTruthy();
    });

    it("should validate correctly a simple search with adults only", () => {
      expect(regexSingleCities.test("EZE LON 2023-12 3")).toBeTruthy();
    });
    it("should validate correctly a simple search with cabin type only", () => {
      expect(regexSingleCities.test("EZE LON 2023-12 ECO")).toBeTruthy();
    });

    it("should validate correctly a simple search with cabin type and amount of travellers", () => {
      expect(regexSingleCities.test("EZE LON 2023-12 ECO 3")).toBeTruthy();
      expect(regexSingleCities.test("EZE LON 2023-12 3 ECO")).toBeTruthy();
    });

    it("should reject wrong entries", () => {
      expect(regexSingleCities.test("EZE2 LON 2023-12")).toBeFalsy();
      expect(regexSingleCities.test("EZE2 LON 2023-12-12")).toBeFalsy();
    });
  });

  describe("regexMultipleDestinationMonthly", () => {
    it("should validate correctly a destination region search", () => {
      expect(
        regexMultipleDestinationMonthly.test("EZE EUROPA 2023-12")
      ).toBeTruthy();
    });

    it("should validate correctly a destination region with adults only", () => {
      expect(
        regexMultipleDestinationMonthly.test("EZE EUROPA 2023-12 3")
      ).toBeTruthy();
    });
    it("should validate correctly a destination regio with cabin type only", () => {
      expect(
        regexMultipleDestinationMonthly.test("EZE EUROPA 2023-12 ECO")
      ).toBeTruthy();
    });

    it("should validate correctly a destination regio with cabin type and amount of travellers", () => {
      expect(
        regexMultipleDestinationMonthly.test("EZE EUROPA 2023-12 ECO 3")
      ).toBeTruthy();
      expect(
        regexMultipleDestinationMonthly.test("EZE EUROPA 2023-12 3 ECO")
      ).toBeTruthy();
    });

    it("should reject wrong entries", () => {
      expect(
        regexMultipleDestinationMonthly.test("EZE2 EUROPA 2023-12")
      ).toBeFalsy();
    });
  });

  describe("regexMultipleDestinationFixedDay", () => {
    it("should validate correctly a destination region search", () => {
      expect(
        regexMultipleDestinationFixedDay.test("EZE EUROPA 2023-12-12")
      ).toBeTruthy();
    });

    it("should validate correctly a destination region search for specific date", () => {
      expect(
        regexMultipleDestinationFixedDay.test("EZE EUROPA 2023-12-12")
      ).toBeTruthy();
    });

    it("should validate correctly a destination region for specific date with adults only", () => {
      expect(
        regexMultipleDestinationFixedDay.test("EZE EUROPA 2023-12-12 3")
      ).toBeTruthy();
    });
    it("should validate correctly a destination regio for specific date with cabin type only", () => {
      expect(
        regexMultipleDestinationFixedDay.test("EZE EUROPA 2023-12-12 ECO")
      ).toBeTruthy();
    });

    it("should validate correctly a destination regio with cabin type and amount of travellers", () => {
      expect(
        regexMultipleDestinationFixedDay.test("EZE EUROPA 2023-12-12 ECO 3")
      ).toBeTruthy();
      expect(
        regexMultipleDestinationFixedDay.test("EZE EUROPA 2023-12-12 3 ECO")
      ).toBeTruthy();
    });

    it("should reject wrong entries", () => {
      expect(
        regexMultipleDestinationFixedDay.test("EZE2 EUROPA 2023-12")
      ).toBeFalsy();
      expect(
        regexMultipleDestinationFixedDay.test("EZE2 EUROPA 2023-12-12")
      ).toBeFalsy();
    });
  });

  describe("regexMultipleOriginMonthly", () => {
    it("should validate correctly a origin region search", () => {
      expect(
        regexMultipleOriginMonthly.test("EUROPA EZE 2023-12")
      ).toBeTruthy();
    });

    it("should validate correctly a origin region with adults only", () => {
      expect(
        regexMultipleOriginMonthly.test("EUROPA EZE 2023-12 3")
      ).toBeTruthy();
    });
    it("should validate correctly a origin region with cabin type only", () => {
      expect(
        regexMultipleOriginMonthly.test("EUROPA EZE 2023-12 ECO")
      ).toBeTruthy();
    });

    it("should validate correctly a origin region with cabin type and amount of travellers", () => {
      expect(
        regexMultipleOriginMonthly.test("EUROPA EZE 2023-12 ECO 3")
      ).toBeTruthy();
      expect(
        regexMultipleOriginMonthly.test("EUROPA EZE 2023-12 3 ECO")
      ).toBeTruthy();
    });

    it("should reject wrong entries", () => {
      expect(
        regexMultipleOriginMonthly.test("EZE2 EUROPA 2023-12")
      ).toBeFalsy();
      expect(
        regexMultipleOriginMonthly.test("EZE2 EUROPA 2023-12-12")
      ).toBeFalsy();
    });
  });

  describe("regexMultipleOriginFixedDay", () => {
    it("should validate correctly a origin region search", () => {
      expect(
        regexMultipleOriginFixedDay.test("EUROPA EZE 2023-12-12")
      ).toBeTruthy();
    });

    it("should validate correctly a origin region search for specific date", () => {
      expect(
        regexMultipleOriginFixedDay.test("EUROPA EZE 2023-12-12")
      ).toBeTruthy();
    });

    it("should validate correctly a origin region for specific date with adults only", () => {
      expect(
        regexMultipleOriginFixedDay.test("EUROPA EZE 2023-12-12 3")
      ).toBeTruthy();
    });
    it("should validate correctly a origin region for specific date with cabin type only", () => {
      expect(
        regexMultipleOriginFixedDay.test("EUROPA EZE 2023-12-12 ECO")
      ).toBeTruthy();
    });

    it("should validate correctly a origin region with cabin type and amount of travellers", () => {
      expect(
        regexMultipleOriginFixedDay.test("EUROPA EZE 2023-12-12 ECO 3")
      ).toBeTruthy();
      expect(
        regexMultipleOriginFixedDay.test("EUROPA EZE 2023-12-12 3 ECO")
      ).toBeTruthy();
    });

    it("should reject wrong entries", () => {
      expect(
        regexMultipleOriginFixedDay.test("EZE2 EUROPA 2023-12")
      ).toBeFalsy();
      expect(
        regexMultipleOriginFixedDay.test("EZE2 EUROPA 2023-12-12")
      ).toBeFalsy();
    });
  });

  describe("regexRoundTrip", () => {
    it("should validate correctly a round trip with a required min amount of days", () => {
      expect(
        regexRoundTrip.test("EZE BCN 2023-03-01 2023-03-30 m7")
      ).toBeTruthy();
    });

    it("should validate correctly a round trip with a min and max dates", () => {
      expect(
        regexRoundTrip.test("EZE BCN 2023-03-01 2023-03-30 m7 M14")
      ).toBeTruthy();
    });

    it("should validate correctly a round trip with a min and max dates with cabin and adults", () => {
      expect(
        regexRoundTrip.test("EZE BCN 2023-03-01 EJE 2 2023-03-30 m7 ECO 3")
      ).toBeTruthy();
      expect(
        regexRoundTrip.test("EZE BCN 2023-03-01 2 2023-03-30 m7 3")
      ).toBeTruthy();
      expect(
        regexRoundTrip.test("EZE BCN 2023-03-01 EJE 2023-03-30 m7 ECO")
      ).toBeTruthy();
    });
  });

  describe("regexFilters", () => {
    it("should validate aerolineas a excluir", () => {
      expect(regexFilters.test("/filtros a:AR")).toBeTruthy();
      expect(regexFilters.test("/filtros a:AR AA")).toBeTruthy();
      expect(regexFilters.test("/filtros a:ARE")).toBeFalsy();
    });

    it("should validate amount of stops", () => {
      expect(regexFilters.test("/filtros e:0")).toBeTruthy();
      expect(regexFilters.test("/filtros e:1")).toBeTruthy();
      expect(regexFilters.test("/filtros e:2")).toBeTruthy();
      expect(regexFilters.test("/filtros e:3")).toBeFalsy();
    });

    it("should validate amount of results", () => {
      expect(regexFilters.test("/filtros r:1")).toBeTruthy();
      expect(regexFilters.test("/filtros r:10")).toBeTruthy();
      expect(regexFilters.test("/filtros r:100")).toBeFalsy();
    });
    it("should validate length of flight", () => {
      expect(regexFilters.test("/filtros h:1")).toBeTruthy();
      expect(regexFilters.test("/filtros h:10")).toBeTruthy();
      expect(regexFilters.test("/filtros h:100")).toBeFalsy();
    });

    it("should validate flights that only accept viaje facil", () => {
      expect(regexFilters.test("/filtros vf")).toBeTruthy();
      expect(regexFilters.test("/filtros vff")).toBeFalsy();
    });

    it("should validate flights that are not gol", () => {
      expect(regexFilters.test("/filtros singol")).toBeTruthy();
      expect(regexFilters.test("/filtros singoll")).toBeFalsy();
    });

    it("should validate showing prices with smiles and money", () => {
      expect(regexFilters.test("/filtros smilesandmoney")).toBeTruthy();
      expect(regexFilters.test("/filtros smilesandmoneyy")).toBeFalsy();
    });

    it("should validate combined filters", () => {
      expect(regexFilters.test("/filtros a:AV e:0 r:30 vf")).toBeTruthy();
      expect(
        regexFilters.test("/filtros a:AV e:0 r:30 vf smilesandmoney")
      ).toBeTruthy();
      expect(
        regexFilters.test("/filtros a:AV e:0 r:30 vf singol smilesandmoney")
      ).toBeTruthy();
    });
  });
});
