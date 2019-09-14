import { insertionSortForColors } from "../src/algorithms";

describe("Main algorithms", () => {
  test("insertionSortForColors", () => {
    const unsortedColors = ["#fff", "rgba(0, 0, 0, 0.3)"];
    const sortedColors = ["rgba(0, 0, 0, 0.3)", "#fff"];

    expect(insertionSortForColors(unsortedColors)).toStrictEqual(sortedColors);
  });
});
