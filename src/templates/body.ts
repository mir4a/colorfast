import { insertionSortForColors } from "../algorithms";

/**
 * Generates html markup for output in colors list
 * @param map [[ColorMap]]
 * @returns html string
 */
export function generateMarkup(map: ColorMap): string {
  const colors: string[] = Array.from(map.keys());

  const sortedColors = insertionSortForColors(colors);
  let html = "";

  sortedColors.forEach((val): void => {
    let title = "";
    const data = map.get(val);
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
