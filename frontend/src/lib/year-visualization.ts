const YEAR_REFERENCE = 2023;

const normalizeMod = (value: number, modulo: number): number =>
  ((value % modulo) + modulo) % modulo;

export const getObservationYear = (value: string): number | null => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.getUTCFullYear();
};

export const getYearRange = (year: number): { from: string; to: string } => ({
  from: `${year}-01-01`,
  to: `${year}-12-31`,
});

export const getYearPalette = (
  year: number,
): {
  fill: string;
  light: string;
  dark: string;
  chipBg: string;
  chipText: string;
} => {
  const offset = year - YEAR_REFERENCE;
  const hue = Math.round(normalizeMod(22 + offset * 137.508, 360));
  const saturation = 68 - (Math.abs(offset) % 4) * 3;
  const lightness = 48 + (Math.abs(offset) % 3) * 2;

  return {
    fill: `hsl(${hue} ${saturation}% ${lightness}%)`,
    light: `hsl(${hue} ${Math.min(saturation + 8, 86)}% ${Math.min(lightness + 12, 74)}%)`,
    dark: `hsl(${hue} ${Math.max(saturation - 8, 50)}% ${Math.max(lightness - 12, 28)}%)`,
    chipBg: `hsl(${hue} ${Math.min(saturation + 8, 86)}% ${Math.min(lightness + 30, 92)}% / 0.18)`,
    chipText: `hsl(${hue} ${Math.min(saturation + 18, 90)}% ${Math.max(lightness - 18, 22)}%)`,
  };
};
