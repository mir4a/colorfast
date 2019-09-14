import { getColorIndex } from "./helpers";

/**
 * Compare two numeric values
 * @param a number
 * @param b
 * @returns {boolean}
 */
function compareTwoNumbers( a: number, b: number ): boolean {
  return (a - b) > 0;
}

/**
 * Sort array of colors using Insertion Sort Algorithm
 * @param colors unsorted array of color strings
 * @returns new sorted array
 */
export function insertionSortForColors( colors: string[] ): string[] {

  const result: string[] = colors.slice();

  for (let i = 1; i < result.length; i++) {
    let currentPos = i;

    while (
      currentPos > 0
      && compareTwoNumbers(
        getColorIndex(result[currentPos - 1]),
        getColorIndex(result[currentPos]))
    ) {
      // swap(result, currentPos, currentPos - 1);
      [result[currentPos], result[currentPos - 1]] = [result[currentPos - 1], result[currentPos]]; // swap in ES6 syntax
      currentPos -=1;
    }
  }

  return result;
}
