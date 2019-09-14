import fs from "fs";
import path from "path";
import { getHeader } from "./header";
import { getFooter } from "./footer";
import { generateMarkup } from "./body";

/**
 * Joins together content from templates
 * @param map __global__ mutable color map
 */
export function generateHTML(map: ColorMap): string {
  const scripts = fs.readFileSync(path.join(__dirname, "./scripts.js"), "utf-8");

  return `
    ${getHeader(map)}
    ${generateMarkup(map)}
    <script>
      ${scripts}
    </script>
    ${getFooter()}
  `;
}

/**
 * @param html content for generated file
 * @param outputDir where to save file
 */
export default function createFile(html: string, outputDir: string): void {
  const outputPath = path.join(outputDir, "colorfast-report.html");

  fs.writeFileSync(outputPath, html, "utf-8");
}
