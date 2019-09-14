import fs from "fs";
import path from "path";

export function getStyles() {
  return fs.readFileSync(path.join(__dirname, "./styles.css"), "utf-8");
}

export function getHeader(map: ColorMap): string {
  return `
<!doctype html>
<html>
<head>
<title>${map.size} colors (${(new Date).toLocaleDateString()})</title>
<style>
  ${getStyles()}
</style>
</head>
<body>
  `;
}
