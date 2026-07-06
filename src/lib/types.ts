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
}

export interface Review {
  id: string;
  bookId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
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
}

export interface AdminSettings {
  username: string;
  password: string;
  libraryOpenDay: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  libraryOpenDate?: string;
  leaderboardNotice: string;
  leaderboardVisible: boolean;
  leaderboardVisibleUntil?: string;
  leaderboardFromDate?: string;
}

export type Category =
  | "Islamic"
  | "Novel"
  | "English Novel"
  | "Story"
  | "Biography"
  | "Science"
  | "English"
  | "Arabic"
  | "Language"
  | "History"
  | "General"
  | "Travelogue"
  | "Poem"
  | "Others";

export interface Student {
  id: string;
  name: string;
  class: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export type ReadStatus = "not_read" | "half_read" | "full_read";

export interface LeaderboardEntry {
  name: string;
  className?: string;
  points: number;
  fullRead: number;
  halfRead: number;
  reviewCount: number;
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

