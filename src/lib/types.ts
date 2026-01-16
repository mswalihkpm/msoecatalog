export interface Book {
  id: string;
  siNumber: string;
  title: string;
  author: string;
  category: string;
  numberCode: string;
  description?: string;
  coverImage?: string;
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
  borrowerName: string;
  borrowedDate: string;
  returnDate: string;
  isReturned: boolean;
}

export interface AdminSettings {
  username: string;
  password: string;
}

export type Category = 
  | "Fiction"
  | "Non-Fiction"
  | "Science"
  | "History"
  | "Biography"
  | "Technology"
  | "Religion"
  | "Philosophy"
  | "Children"
  | "Other";
