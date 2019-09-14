import {
  fullHEX,
  getColorIndex,
  getHEXValue,
  convertRGBtoHEX,
} from "../src/helpers";

describe('HEX helpers', () => {
  describe("convertShortHEXtoLong", () => {
    test("fallback to black", () => {
      expect(fullHEX()).toBe("#000000");
    })
  });
});

describe("Main helpers", () => {
  describe("getColorIndex", () => {
    const white = "#ffffff";
    const highestHEXColorIndex = 16777215; // including 0 it's 16,777,216

    test("fallback to 0 if color is undefined", () => {
      expect(getColorIndex()).toBe(0);
    });

    test("highest possible color index is 16777216", () => {
      expect(getColorIndex(white)).toBe(highestHEXColorIndex);
    })
  });
});

