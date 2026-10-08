export interface Book {
  id: string;
  siNumber: string;
  title: string;
  author: string;
  category: string;
  numberCode: string;
  description?: string;
  coverImage?: string;
  volume?: string;
  pages?: string;
  publication?: string;
  isBorrowed: boolean;
  borrowedBy?: string;
  borrowedDate?: string;
  returnDate?: string;
  averageRating: number;
  totalReviews: number;
  visibility?: "library" | "private";
  isMissing?: boolean;
}

export interface Review {
  id: string;
  bookId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  status?: "pending" | "approved" | "hidden";
  helpfulCount?: number;
  studentId?: string;
}


export interface BorrowRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  bookVolume?: string;
  borrowerName: string;
  borrowerClass?: string;
  borrowedDate: string;
  returnDate: string;
  isReturned: boolean;
  readStatus?: ReadStatus;
  reviewConducted?: boolean;
  reviewPoints?: number;
  studentId?: string;
  /** Custom number of pages read (scored via the page tier of the scoring table). */
  pagesRead?: number;
  returnOption?: "not_read" | "full_read" | "half_read" | "custom_page";
  pagesUsed?: number;
  rateUsed?: number;
  rateVersionId?: string;
  calculatedPoints?: number;
  maxPossiblePoints?: number;
  returnedAt?: string;
}

export interface ReadingRateVersion {
  id: string;
  category: string;
  pointsPer10Pages: number;
  effectiveFrom: string;
  createdAt: string;
}


export interface BookRequest {
  id: string;
  bookId: string;
  bookTitle: string;
  bookNumberCode: string;
  bookVolume?: string;
  requesterName: string;
  requesterClass: string;
  requestDate: string;
  returnDate?: string;
  status: "pending" | "approved" | "rejected";
  studentId?: string;
}

/** Editable 14x7 scoring table. Keys are categories, values map page-range -> points. */
export type PageTier = "b50" | "b100" | "b150" | "b200" | "b250" | "b300" | "a300";
export type ScoringTable = Record<string, Record<PageTier, number>>;

export const PAGE_TIER_LABELS: Record<PageTier, string> = {
  b50: "Below 50",
  b100: "Below 100",
  b150: "Below 150",
  b200: "Below 200",
  b250: "Below 250",
  b300: "Below 300",
  a300: "Above 300",
};

export interface AdminSettings {
  username: string;
  password: string;
  libraryOpenDay: number;
  libraryOpenDate?: string;
  leaderboardNotice: string;
  leaderboardVisible: boolean;
  leaderboardVisibleUntil?: string;
  leaderboardFromDate?: string;
  scoringTable?: ScoringTable;
  reviewPointsDefault?: number;
  leaderboardVisibleFrom?: string;
  creativityCategories?: string[];
}

export type Category =
  | "Islamic"
  | "General"
  | "Science"
  | "History"
  | "English"
  | "Autobiography"
  | "Biography"
  | "Travelogue"
  | "Arabic"
  | "Poem"
  | "English Novel"
  | "Story"
  | "Novel"
  | "English Story"
  | "Language"
  | "Others";

export type StudentType = "old" | "new";

export interface Student {
  id: string;
  name: string;
  class: string;
  code: string;
  houseName?: string;
  fatherName?: string;
  dateOfBirth?: string; // stored as DD/MM/YYYY
  studentType?: StudentType;
  /** External Students Performance Rate (SPR) identifier. */
  sprStudentId?: string;
  migratedFrom?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReadStatus = "not_read" | "half_read" | "full_read";

export interface BorrowRecordExtra {
  reviewPoints?: number; // per-record custom bonus
}

export interface LeaderboardEntry {
  name: string;
  className?: string;
  points: number;
  fullRead: number;
  halfRead: number;
  reviewCount: number;
  studentId?: string;
  sprStudentId?: string;
}

export interface LeaderboardSnapshot {
  id: string;
  name: string;
  fromDate?: string;
  untilDate?: string;
  notice?: string;
  entries: LeaderboardEntry[];
  createdAt: string;
}

export interface CreativeWork {
  id: string;
  title: string;
  writer?: string;
  media?: string;
  category?: string;
  workDate: string; // yyyy-MM-dd
  fileUrl: string;
  fileType: "image" | "pdf" | "video";
  coverUrl?: string;
  createdAt: string;
}
