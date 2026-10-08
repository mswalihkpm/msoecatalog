export const READING_RATE_CATEGORIES = [
  "Islamic",
  "General",
  "Science",
  "History",
  "English",
  "Autobiography",
  "Biography",
  "Travelogue",
  "Arabic",
  "Poem",
  "English Novel",
  "Story",
  "English Story",
  "Language",
  "Others",
] as const;

export const parsePageCount = (value: string | number | undefined): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number.parseInt(String(value ?? "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const calculateReadingPoints = (pages: number, rate: number): number =>
  Math.round(((pages / 10) * rate + Number.EPSILON) * 1_000_000) / 1_000_000;

export const displayReadingPoints = (points: number): string => points.toFixed(2);