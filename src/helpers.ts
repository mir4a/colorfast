
/**
 * @param hex color in HEX format
 * @return long HEX format or fallback to black if hex is not defined
 * or to hex if it seems already to be in long format
 */
export function convertShortHEXtoLong(hex?: string): string {
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
export function getHEXValue(hex: string): number {
  const bytes = hex.slice(1);
  const value = parseInt(bytes, 16);

  return isNaN(value) ? 0 : value;
}

/**
 * Convert RGB to HEX
 * @param rgb color in RGB format
 * @returns color in HEX format or empty string if color is not matching RGBA pattern
 */
export function rgb2hex(rgb: string): string {
  const rgbRegExp = /^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i;
  const result = rgb.match(rgbRegExp);

  return (result && rgb.length === 4)
    ? "#" +
    ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) +
    ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) +
    ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2)
    : "";
}

/**
 * Resolve color format and get it's value as natural numbers
 * @param color in unknown format
 */
export function getColorIndex(color: string): number {
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
