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
