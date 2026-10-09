import type { Book, BorrowRecord, ReadingRateVersion } from "./types";

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
  "Novel",
  "English Novel",
  "Story",
  "English Story",
  "Language",
  "Others",
] as const;

export type ReturnOption = "not_read" | "full_read" | "half_read" | "custom_page";

export const RETURN_OPTION_LABELS: Record<ReturnOption, string> = {
  full_read: "Full read",
  half_read: "Half read",
  custom_page: "Custom pages",
  not_read: "Not read",
};

export const parsePageCount = (value: string | number | undefined): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number.parseInt(String(value ?? "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const calculateReadingPoints = (pages: number, rate: number): number =>
  Math.round(((pages / 10) * rate + Number.EPSILON) * 1_000_000) / 1_000_000;

export const roundPoints = (points: number): number =>
  Math.round((points + Number.EPSILON) * 1_000_000) / 1_000_000;

export const displayReadingPoints = (points: number | undefined | null): string =>
  Number(points ?? 0).toFixed(2);

/** Rate version in effect for a category at a given moment (falls back to "Others"). */
export const getRateAt = (
  versions: ReadingRateVersion[],
  category: string | undefined,
  at: Date = new Date(),
): ReadingRateVersion | undefined => {
  const pick = (cat: string) =>
    versions
      .filter((v) => v.category === cat && new Date(v.effectiveFrom).getTime() <= at.getTime())
      .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime())[0];
  return pick(category || "Others") ?? pick("Others");
};

/** The return option stored on (or implied by) a borrow record. */
export const recordReturnOption = (r: BorrowRecord): ReturnOption => {
  if (r.returnOption) return r.returnOption;
  if (r.readStatus === "full_read") return "full_read";
  if (r.readStatus === "half_read") return r.pagesRead && r.pagesRead > 0 ? "custom_page" : "half_read";
  return "not_read";
};

export interface ScoreResult {
  returnOption: ReturnOption;
  readStatus: "not_read" | "half_read" | "full_read";
  pagesRead: number | null;
  pagesUsed: number;
  rateUsed: number;
  rateVersionId?: string;
  calculatedPoints: number;
  maxPossiblePoints: number;
}

/**
 * Score one reading outcome.
 * Full = (book pages / 10) × rate; Half = 50% of Full; Custom = (entered pages / 10) × rate.
 */
export const scoreReading = (
  book: Pick<Book, "category" | "pages"> | undefined,
  option: ReturnOption,
  customPages: number | undefined,
  rate: { value: number; versionId?: string },
): ScoreResult => {
  const totalPages = parsePageCount(book?.pages);
  const full = calculateReadingPoints(totalPages, rate.value);
  const base = { rateUsed: rate.value, rateVersionId: rate.versionId, maxPossiblePoints: full };
  switch (option) {
    case "full_read":
      return { ...base, returnOption: option, readStatus: "full_read", pagesRead: null, pagesUsed: totalPages, calculatedPoints: full };
    case "half_read":
      return { ...base, returnOption: option, readStatus: "half_read", pagesRead: null, pagesUsed: totalPages / 2, calculatedPoints: roundPoints(full / 2) };
    case "custom_page": {
      const pages = Math.max(0, customPages ?? 0);
      return { ...base, returnOption: option, readStatus: "half_read", pagesRead: pages, pagesUsed: pages, calculatedPoints: calculateReadingPoints(pages, rate.value) };
    }
    default:
      return { ...base, returnOption: "not_read", readStatus: "not_read", pagesRead: null, pagesUsed: 0, calculatedPoints: 0 };
  }
};

/** Resolve which rate to apply to a record: its frozen rate if it has one, else the rate effective at `at`. */
export const rateForRecord = (
  record: BorrowRecord | undefined,
  book: Pick<Book, "category"> | undefined,
  versions: ReadingRateVersion[],
  at: Date = new Date(),
): { value: number; versionId?: string } => {
  if (record?.rateUsed !== undefined && record.rateUsed !== null && record.rateVersionId) {
    return { value: record.rateUsed, versionId: record.rateVersionId };
  }
  const v = getRateAt(versions, book?.category, at);
  return { value: v?.pointsPer10Pages ?? 0, versionId: v?.id };
};

/** Points a record earns from reading (excluding the review bonus). Uses stored points when frozen. */
export const readingPointsForRecord = (
  record: BorrowRecord,
  book: Pick<Book, "category" | "pages"> | undefined,
  versions: ReadingRateVersion[],
): number => {
  if (record.calculatedPoints !== undefined && record.calculatedPoints !== null) return record.calculatedPoints;
  const option = recordReturnOption(record);
  if (option === "not_read") return 0;
  return scoreReading(book, option, record.pagesRead, rateForRecord(record, book, versions)).calculatedPoints;
};
