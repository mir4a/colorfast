#!/usr/bin/env node
const argv = require("minimist")(process.argv.slice(2));
const inputDir = argv.input || argv.i;
const schemePath = argv.scheme || argv.s;
const reportPath = argv.report || argv.r;

const report = require("../build/templates/index");
const colorFast = require("../build").default;

const help = `
usage: npx colorfast [--input|-i] [--scheme|-s] [--report|-r]
  --input "path/to/dir/with/sass"
  --scheme "path/to/file/containing/sass/variables"
  --report "path/where/to/save/report"
`

if (!inputDir || !schemePath || !reportPath) {
  console.log(help);
  process.exit(1);
}

const colorMap = colorFast(inputDir, schemePath);
const html = report.generateHTML(colorMap);
report.default(html, reportPath);
process.exit(0);
