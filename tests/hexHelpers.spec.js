import {
  convertShortHEXtoLong,
  getHEXValue,
  rgb2hex
} from "../src/hexHelpers";

describe('HEX helpers', () => {
  describe("convertShortHEXtoLong", () => {
    test("fallback to black", () => {
      expect(convertShortHEXtoLong()).toBe("#000000");
    })
  });
});
