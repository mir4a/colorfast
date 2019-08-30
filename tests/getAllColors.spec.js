import {
  insertionSortForColors,
  getColorIndex,
} from "../src/getAllColors";

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

describe("Main algorithms", () => {
  test("insertionSortForColors", () => {
    const unsortedColors = ["#fff", "rgba(0, 0, 0, 0.3)"];
    const sortedColors = ["rgba(0, 0, 0, 0.3)", "#fff"];

    expect(insertionSortForColors(unsortedColors)).toStrictEqual(sortedColors);
  });
});
