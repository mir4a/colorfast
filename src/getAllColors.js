"use strict";

const fs = require("fs");
const path = require("path");
const colorRegexp = /(#[A-F\d]{3}\b|#[A-F\d]{6}\b)|(rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?([, \.\d]+)?\))/gi; // eslint-disable-line
const sassVariableRegexp = /(\$[\S\d]+)\b/gi;
let colorMap;
let fileCounter = 0;


/**
 * Search for colors in stylesheets, add them into color map
 * @param  {[type]} data     [description]
 * @param  {[type]} filePath [description]
 * @param  {[type]} map      [description]
 * @return {[type]}          Array of colors
 */
function parseStylesheetsColors(data, filePath, map) {
  const lines = data.split("\n");
  let result = [];
  let test;
  let totalReadData = 0;

  for (let i = 0, len = lines.length; i < len; i++) {
    let lineStr = `${filePath}:${i+1}:`;

    totalReadData += lines[i].length + 1;

    while (test = colorRegexp.exec(lines[i])) {
      // FIXME: Find out how to extract alpha channel
      let colorData = {
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
 * @param  {[type]} data     [description]
 * @return {[type]}          Array of objects { color: , variable: }
 */
function parseColorSheme(data) {
  var result = [];
  var test;
  var variable;
  var lines = data.split("\n");

  for (var i = 0, len = lines.length; i < len; i++) {
    // FIXME: Find out how to extract alpha channel
    while (test = colorRegexp.exec(lines[i])) {
      while (variable = sassVariableRegexp.exec(lines[i])) {
        result.push({
          color: test[0],
          variable: variable[0]
        });
      }
    }
  }

  return result;
}


function addToMap(color, colorData, map) {
  var normalizedColor = color.toLowerCase();
  var longColor = convertShortHEXtoLong(normalizedColor);

  if (map.has(longColor)) {
    let val = map.get(longColor);

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

function pathType(path) {
  var stat = fs.statSync(path);
  var type;

  if (stat.isFile()) {
    type = "FILE";
  } else if (stat.isDirectory()) {
    type = "DIRECTORY";
  } else {
    type = undefined;
  }

  return type;
}

function processDir(path, skip) {
  let files = [];

  if (Array.isArray(path)) {
    for (let el of path) {
      files = fs.readdirSync(el);
      main(files, el, skip);
    }
  } else {
    files = fs.readdirSync(path);
    main(files, path, skip);
  }
}

function main(files, dir, skip) {

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

function processFile(filePath) {
  let data = fs.readFileSync(filePath, "utf-8");
  let colors = parseStylesheetsColors(data, filePath, colorMap);

  countAndPrintProcessedFiles(filePath, colors);
}

function handleScheme(filePath) {
  var data = fs.readFileSync(filePath, "utf-8");
  var scheme = parseColorSheme(data);

  return scheme;
}

function countAndPrintProcessedFiles(filePath, colors) {
  ++fileCounter;
  console.log(`${fileCounter}: ${filePath} — found ${colors.length} colors`);

  return fileCounter;
}

function mainHandler(dir, skip) {
  colorMap = new Map();

  var start = new Date();
  var end, diff;
  let dirType = pathType(dir);

  if (dirType === "FILE") {
    processFile(dir);
  } else {
    processDir(dir, skip);
  }
  end = new Date();
  diff = end - start;
  console.log(`Finished for ${diff}ms, found ${colorMap.size} colors`);
  fileCounter = 0;

  return colorMap;
}

/**
 * Generates html markup for output in colors list
 * @param map
 * @returns {string}
 */
function generateMarkup(map) {
  // var colors = "";
  var sortedColors = insertionSortForColors([...map.keys()], map);
  var html = "";

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

function rgb2hex(rgb){
  rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);

  return (rgb && rgb.length === 4) ? "#" +
  ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : "";
}


/**
 * Compare two numeric values
 * @param a
 * @param b
 * @returns {boolean}
 */
function compareTwoNumbers( a, b ) {
  return (a - b) > 0;
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


/**
 * Returns new sorted array using Insertion Sort Algorithm
 * @param arr
 * @returns {Array|number}
 */
function insertionSort( array ) {
  var arr = array.slice();

  for (var i = 1; i <= arr.length; i++) {
    var currentPos = i;

    while (currentPos > 0 && compareTwoNumbers(parseInt(arr[currentPos - 1]), parseInt(arr[currentPos]))) {
      swap(arr, currentPos, currentPos - 1);
      currentPos -= 1;
    }
  }

  return arr;
}


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

function getHEXValue(hex) {
  var bytes = hex.slice(1);
  var value = parseInt(bytes, 16);

  return isNaN(value) ? 0 : value;
}



module.exports = {
  gather: mainHandler,
  colorIndex: getColorIndex,
  sort: insertionSortForColors,
  markup: generateMarkup,
  scheme: handleScheme,
};
