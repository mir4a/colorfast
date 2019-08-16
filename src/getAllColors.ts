"use strict";

import fs = require("fs");
import path = require("path");

const colorRegexp: RegExp = /(#[A-F\d]{3}\b|#[A-F\d]{6}\b)|(rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?([, \.\d]+)?\))/gi; // eslint-disable-line
const sassVariableRegexp = /(\$[\S\d]+)\b/gi;
let colorMap: ColorMap;
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


function convertShortHEXtoLong(hex) {
  var tmp = "";

  if (hex && hex.length === 4) {
    tmp = hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  } else if (!hex) {
    return "#000000";
  } else {
    tmp = hex;
  }

  return tmp;
}

function getHEXValue(hex) {
  var bytes = hex.slice(1);
  var value = parseInt(bytes, 16);

  return isNaN(value) ? 0 : value;
}

function rgb2hex(rgb){
  rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);

  return (rgb && rgb.length === 4) ? "#" +
  ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : "";
}

function getColorIndex(color) {
  var index, hex;

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
  var normalizedColor = color.toLowerCase();
  var longColor = convertShortHEXtoLong(normalizedColor);

  if (map.has(longColor)) {
    const val: ColorData = map.get(longColor);

    val.meta.push(colorData);
    val.index = getColorIndex(longColor);
    map.set(longColor, val);
  } else {
    let val2 = {
      meta: [],
      index: 0
    };

    val2.meta.push(colorData);
    val2.index = getColorIndex(longColor);
    map.set(longColor, val2);
  }

  return map;
}

function compareTwoColorIndex( colorA, colorB ) {
  // console.log(`arA = ${arA}; arB = ${arB}`);
  var indexA = colorMap.get(colorA);
  var indexB = colorMap.get(colorB);

  if (indexA && indexB) {
    return (indexA.index - indexB.index) < 0;
  } else {
    return;
  }
}

// /**
//  * Compare two numeric values
//  * @param a
//  * @param b
//  * @returns {boolean}
//  */
// function compareTwoNumbers( a, b ) {
//   return (a - b) > 0;
// }

/**
 * Swap tow elements in array
 * @param arr
 * @param posA
 * @param posB
 */
function swap( arr, posA, posB ) {
  var temp = arr[posA];

  arr[posA] = arr[posB];
  arr[posB] = temp;
}


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
 * Returns new sorted array using Insertion Sort Algorithm
 * @param arr
 * @returns {Array|number}
 */
function insertionSortForColors( array ) {
  // console.log(array);
  var arr = array.slice();

  for (var i = 1; i <= arr.length; i++) {
    var currentPos = i;

    while (currentPos > 0 && compareTwoColorIndex(arr[currentPos - 1], arr[currentPos])) {
      swap(arr, currentPos, currentPos - 1);
      currentPos -=1;
    }
  }

  return arr;
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
  let test: RegExpExecArray;
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
 * @return Array of objects { color: , variable: }
 */
function parseColorSheme(data: string): Record<string, any>[] {
  let result: Record<string, any>[] = [];
  let test: RegExpExecArray;
  let variable: RegExpExecArray;
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
function processDir(path: string, skip: string) {
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

function countAndPrintProcessedFiles(filePath, colors) {
  ++fileCounter;
  console.log(`${fileCounter}: ${filePath} — found ${colors.length} colors`);

  return fileCounter;
}

function processFile(filePath) {
  let data = fs.readFileSync(filePath, "utf-8");
  let colors = parseStylesheetsColors(data, filePath, colorMap);

  countAndPrintProcessedFiles(filePath, colors);
}

/**
 * Processes given files
 * @param files 
 * @param dir 
 * @param skip fullpath to the color scheme file _for example colors.sass with all color variables_
 */
function main(files: string[], dir: string, skip: string) {

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


function handleScheme(filePath) {
  var data = fs.readFileSync(filePath, "utf-8");
  var scheme = parseColorSheme(data);

  return scheme;
}

/**
 * Basically the gathering function runner which __mutate__ global `colorMap`
 * @param dir directory for colors scanning
 * @param skip fullpath to the color scheme file _for example colors.sass with all color variables_
 */
function mainHandler(dir, skip: string): Map<string, Record<string, any>> {
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
 * @param map
 * @returns {string}
 */
function generateMarkup(map: ColorMap) {
  const keys: Iterator<string> = map.keys();
  const sortedColors = insertionSortForColors(keys);
  let html = "";

  sortedColors.forEach((val)=>{
    let title = "";
    let index = map.get(val).index;
    let appearsCounter = 0;

    map.get(val).meta.forEach((meta)=>{
      appearsCounter++;
      title += `${meta.xPath}\n`;
    });
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
  scheme: handleScheme,
};
