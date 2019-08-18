"use strict";

import fs = require("fs");
import path = require("path");

const colorRegexp: RegExp = /(#[A-F\d]{3}\b|#[A-F\d]{6}\b)|(rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?([, \.\d]+)?\))/gi; // eslint-disable-line
const sassVariableRegexp = /(\$[\S\d]+)\b/gi;
let colorMap: ColorMap; // TODO: Globall mutated variable!!!
let fileCounter = 0;

interface ColorMeta {
  alpha?: number;
  filePath: string;
  originalValue: string;
  startPos: number;
  xPath: string;
}

interface ColorData {
  index: number;
  meta: ColorMeta[];
}

type ColorMap = Map<string, ColorData>;

interface SchemeData {
  color: string;
  variable: string;
}


/**
 * @param hex color in HEX format
 * @return long HEX format or fallback to black if hex is not defined
 * or to hex if it seems already to be in long format
 */
function convertShortHEXtoLong(hex?: string): string {
  let result = "";

  if (hex && hex.length === 4) {
    result = hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  } else if (!hex) {
    return "#000000";
  } else {
    result = hex;
  }

  return result;
}

/**
 * Retrieve number from HEXademical color _long_ format
 * which could be useful for sorting
 * @param hex color in _long_ HEX format
 * @returns number from 0 to 16777215
 */
function getHEXValue(hex: string): number {
  const bytes = hex.slice(1);
  const value = parseInt(bytes, 16);

  return isNaN(value) ? 0 : value;
}

/**
 * Convert RGB to HEX
 * @param rgb color in RGB format
 * @returns color in HEX format or empty string if color is not matching RGBA pattern
 */
function rgb2hex(rgb: string): string {
  const rgbRegExp = /^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i;
  const result = rgb.match(rgbRegExp);

  return (result && rgb.length === 4) 
    ? "#" +
      ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
      ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
      ("0" + parseInt(rgb[3],10).toString(16)).slice(-2)
    : "";
}

/**
 * Resolve color format and get it's value as natural numbers
 * @param color in unknown format
 */
function getColorIndex(color: string): number {
  let index: number, hex: string;

  if (color && color[0] === "#") {
    index = getHEXValue(color);
  } else if (!color) {
    return 0;
  } else {
    hex = rgb2hex(color);
    index = getHEXValue(hex);
  }

  return index;
}

/**
 * Mutate global map of colors
 * @param color Long variant of color
 * @param colorData All color metadata
 * @param map Global mutable map
 */
function addToMap(color: string, colorData: ColorMeta, map: ColorMap): ColorMap {
  const normalizedColor = color.toLowerCase();
  const longColor = convertShortHEXtoLong(normalizedColor);
  const data = map.get(longColor);

  if (data && data.meta) {

    data.meta.push(colorData);
    data.index = getColorIndex(longColor);
    map.set(longColor, data);
  } else {
    let val2: ColorData = {
      meta: [],
      index: 0
    };

    val2.meta.push(colorData);
    val2.index = getColorIndex(longColor);
    map.set(longColor, val2);
  }

  return map;
}

// /**
//  * __DEPRECATED__ Use [[compareTwoNumbers]]
//  * @param colorA in _long_ HEX format
//  * @param colorB in _long_ HEX format
//  */
// function compareTwoColorIndex( colorA: string, colorB: string ): boolean {
//   var indexA = colorMap.get(colorA);
//   var indexB = colorMap.get(colorB);

//   if (indexA && indexB) {
//     return (indexA.index - indexB.index) < 0;
//   } else {
//     return;
//   }
// }

/**
 * Compare two numeric values
 * @param a number
 * @param b
 * @returns {boolean}
 */
function compareTwoNumbers( a: number, b: number ): boolean {
  return (a - b) > 0;
}

// /**
//  * Swap tow elements in array
//  * @param arr
//  * @param posA
//  * @param posB
//  */
// function swap( arr, posA, posB ) {
//   var temp = arr[posA];

//   arr[posA] = arr[posB];
//   arr[posB] = temp;
// }


// /**
//  * Returns new sorted array using Insertion Sort Algorithm
//  * @param arr
//  * @returns {Array|number}
//  */
// function insertionSort( array ) {
//   var arr = array.slice();

//   for (var i = 1; i <= arr.length; i++) {
//     var currentPos = i;

//     while (currentPos > 0 && compareTwoNumbers(parseInt(arr[currentPos - 1]), parseInt(arr[currentPos]))) {
//       swap(arr, currentPos, currentPos - 1);
//       currentPos -= 1;
//     }
//   }

//   return arr;
// }


/**
 * Sort array of colors using Insertion Sort Algorithm
 * @param colors unsorted array of color strings
 * @param colorMap [[ColorMap]] with colors indexes
 * @returns new sorted array
 */
function insertionSortForColors( colors: string[], colorMap: ColorMap ): string[] {

  const result: string[] = colors.slice();

  for (let i = 1; i <= result.length; i++) {
    let currentPos = i;
    const colorA = colorMap.get(result[currentPos - 1]);
    const colorB = colorMap.get(result[currentPos]);
    const colorIndexA = colorA && colorA.index ? colorA.index : 0;
    const colorIndexB = colorB && colorB.index ? colorB.index : 0;

    while (currentPos > 0 && compareTwoNumbers(colorIndexA, colorIndexB)) {
      // swap(result, currentPos, currentPos - 1);
      [result[currentPos], result[currentPos - 1]] = [result[currentPos - 1], result[currentPos]]; // swap in ES6 syntax
      currentPos -=1;
    }
  }

  return result;
}

/**
 * Search for colors in stylesheets, add them into color map
 * @param data content of the given file
 * @param filePath full path to the given file
 * @param map __global__ mutable color map
 * @return  Array of colors
 */
function parseStylesheetsColors(data: string, filePath: string, map: ColorMap): string[] {
  const lines = data.split("\n");
  let result: string[] = [];
  let test: RegExpExecArray | null;
  let totalReadData = 0;

  for (let i = 0, len = lines.length; i < len; i++) {
    let lineStr = `${filePath}:${i+1}:`;

    totalReadData += lines[i].length + 1;
    test = colorRegexp.exec(lines[i]);

    while (test) {
      // FIXME: Find out how to extract alpha channel
      let colorData: ColorMeta = {
        alpha: 1,
        filePath: filePath,
        originalValue: test[0],
        startPos: totalReadData - (lines[i].length - test.index) - 1,
        xPath: lineStr + (test.index + 1),
      };

      addToMap(test[0], colorData, map);
      result.push(test[0]);
    }
  }

  console.log(`totalReadData: ${totalReadData}, data.length: ${data.length}`);

  return result;
}


/**
 * Search for colors in color scheme and prepare data output for view
 * Usually there is at least basic color scheme in project,
 * for instance _colors.sass_ or _variables.sass_ contains a set of colors
 * which was originally designed for the project
 * @return Array of objects { color: , variable: }
 */
function parseColorSheme(data: string): SchemeData[] {
  let result: SchemeData[] = [];
  let test: RegExpExecArray | null;
  let variable: RegExpExecArray | null;
  const lines: string[] = data.split("\n");

  for (var i = 0, len = lines.length; i < len; i++) {
    // FIXME: Find out how to extract alpha channel
    test = colorRegexp.exec(lines[i]);

    while (test) {
      variable = sassVariableRegexp.exec(lines[i]);

      while (variable) {
        result.push({
          color: test[0],
          variable: variable[0]
        });
      }
    }
  }

  return result;
}

/**
 * Checks whether path related to file, directory or undefined
 */
function pathType(path: string): string | undefined {
  const stat = fs.statSync(path);
  let type: string | undefined;

  if (stat.isFile()) {
    type = "FILE";
  } else if (stat.isDirectory()) {
    type = "DIRECTORY";
  } else {
    type = undefined;
  }

  return type;
}

/**
 * Processes directory at given path, collects file names and run main script recursively
 * @param path to
 * @param skip fullpath to the color scheme file _for example colors.sass with all color variables_
 */
function processDir(path: string, skip: string): void {
  let files: string[] = [];

  if (Array.isArray(path)) {
    for (let el of path) {
      files = fs.readdirSync(el);
      main(files, el, skip); // eslint-disable-line @typescript-eslint/no-use-before-define
    }
  } else {
    files = fs.readdirSync(path);
    main(files, path, skip); // eslint-disable-line @typescript-eslint/no-use-before-define
  }
}

/**
 * __warning__ Change global counter and log to console
 * @param filePath current processing file's directory
 * @param colors total number parsed colors in the file
 */
function countAndPrintProcessedFiles(filePath: string, colors: string[]): number {
  ++fileCounter;

  console.log(`${fileCounter}: ${filePath} — found ${colors.length} colors`);

  return fileCounter;
}

/**
 * Task for file processing.
 * * Read data from file
 * * Parse and get colors
 * * run another task [[countAndPrintProcessedFiles]]
 * @param filePath path to particular file for being parsed
 */
function processFile(filePath: string): void {
  let data = fs.readFileSync(filePath, "utf-8");
  let colors = parseStylesheetsColors(data, filePath, colorMap);

  countAndPrintProcessedFiles(filePath, colors);
}

/**
 * Task for processing files list
 * @param files array of file names
 * @param dir path to the dir which contains the `files`
 * @param skip fullpath to the color scheme file _for example colors.sass with all color variables_
 */
function main(files: string[], dir: string, skip: string): void {

  for (let file of files) {
    let filePath = path.resolve(dir, file);
    let pType = pathType(filePath);

    if (pType === "FILE") {
      if (filePath === skip) {
        continue;
      }

      processFile(filePath);
    } else if (pType === "DIRECTORY") {
      processDir(filePath, skip);
    } else {
      console.log(`${filePath} is not file`);
    }

  }
}

/**
 * Task for parsing and getting scheme data
 * 
 * @param schemeFilePath location of scheme file 
 */
function parseSchemeFile(schemeFilePath: string): SchemeData[] {
  const data = fs.readFileSync(schemeFilePath, "utf-8");

  return parseColorSheme(data);
}

/**
 * Basically the gathering function runner which __mutate__ global `colorMap`
 * @param dir directory for colors scanning
 * @param skip fullpath to the color scheme file _for example colors.sass with all color variables_
 */
function mainHandler(dir: string, skip: string): ColorMap {
  colorMap = new Map();

  const start: Date = new Date();
  let end: Date, diff: number;
  let dirType = pathType(dir);

  if (dirType === "FILE") {
    processFile(dir);
  } else {
    processDir(dir, skip);
  }

  end = new Date();
  diff = end.getTime() - start.getTime();
  fileCounter = 0;

  console.log(`Finished for ${diff}ms, found ${colorMap.size} colors`);

  return colorMap;
}

/**
 * Generates html markup for output in colors list
 * @param map [[ColorMap]]
 * @returns html string
 */
function generateMarkup(map: ColorMap): string {
  const colors: string[] = Array.from(map.keys());

  const sortedColors = insertionSortForColors(colors, map);
  let html = "";

  sortedColors.forEach((val): void => {
    let title = "";
    const data = map.get(val)
    let index = data ? data.index : 0;
    let appearsCounter = 0;
    const meta = data && data.meta;

    if (meta) {
      meta.forEach((meta): void => {
        appearsCounter++;
        title += `${meta.xPath}\n`;
      });
    }

    html += `
      <div class="color"
           style="background: ${val}"
           title="${title}"
           data-color="${val}">
        <b>${val}</b>
        <i>${index}</i>
        <i class="counter">${appearsCounter}</i>
      </div>
    `;
  });

  return html;
}

module.exports = {
  gather: mainHandler,
  colorIndex: getColorIndex,
  sort: insertionSortForColors,
  markup: generateMarkup,
  scheme: parseSchemeFile,
};
