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
  status: "pending" | "approved" | "rejected";
}

export interface AdminSettings {
  username: string;
  password: string;
}

export type Category = 
  | "Islamic"
  | "Novel"
  | "Biography"
  | "Science"
  | "English"
  | "Arabic"
  | "History"
  | "General"
  | "Poem"
  | "Others";
