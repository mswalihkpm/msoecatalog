import { Book, Review, BorrowRecord, BookRequest, AdminSettings } from "./types";

// Mock data for initial state
const initialBooks: Book[] = [
  {
    id: "1",
    siNumber: "001",
    title: "Stories of the Prophets",
    author: "Ibn Kathir",
    category: "Islamic",
    numberCode: "ISL-001",
    description: "A collection of stories about the prophets in Islamic tradition.",
    volume: "1",
    pages: "450",
    publication: "Dar us-Salam Publications",
    isBorrowed: false,
    averageRating: 4.9,
    totalReviews: 56,
  },
  {
    id: "2",
    siNumber: "002",
    title: "The Alchemist",
    author: "Paulo Coelho",
    category: "Novel",
    numberCode: "NOV-001",
    description: "A magical fable about following your dreams and listening to your heart.",
    pages: "208",
    publication: "HarperOne",
    isBorrowed: false,
    averageRating: 4.5,
    totalReviews: 24,
  },
  {
    id: "3",
    siNumber: "003",
    title: "Steve Jobs",
    author: "Walter Isaacson",
    category: "Biography",
    numberCode: "BIO-001",
    description: "The exclusive biography of Steve Jobs based on exclusive interviews.",
    pages: "656",
    publication: "Simon & Schuster",
    isBorrowed: true,
    borrowedBy: "Ahmed Hassan",
    borrowedDate: "2026-01-10",
    returnDate: "2026-01-24",
    averageRating: 4.8,
    totalReviews: 42,
  },
  {
    id: "4",
    siNumber: "004",
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    category: "Science",
    numberCode: "SCI-001",
    description: "A landmark volume in science writing exploring the universe.",
    pages: "256",
    publication: "Bantam",
    isBorrowed: false,
    averageRating: 4.6,
    totalReviews: 38,
  },
  {
    id: "5",
    siNumber: "005",
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    category: "History",
    numberCode: "HIS-001",
    description: "A groundbreaking narrative of humanity's creation and evolution.",
    pages: "443",
    publication: "Harper",
    isBorrowed: true,
    borrowedBy: "Fatima Ali",
    borrowedDate: "2026-01-08",
    returnDate: "2026-01-22",
    averageRating: 4.7,
    totalReviews: 31,
  },
  {
    id: "6",
    siNumber: "006",
    title: "Arabic Through the Quran",
    author: "Alan Jones",
    category: "Arabic",
    numberCode: "ARB-001",
    description: "An educational text for learning Arabic through Quranic study.",
    pages: "256",
    publication: "Islamic Texts Society",
    isBorrowed: false,
    averageRating: 4.4,
    totalReviews: 18,
  },
];

const initialReviews: Review[] = [
  {
    id: "1",
    bookId: "1",
    userName: "Reader123",
    rating: 5,
    comment: "A beautiful journey of self-discovery. Highly recommend!",
    createdAt: "2026-01-05",
  },
  {
    id: "2",
    bookId: "1",
    userName: "BookLover",
    rating: 4,
    comment: "Inspiring stories with deep spiritual undertones.",
    createdAt: "2026-01-03",
  },
  {
    id: "3",
    bookId: "2",
    userName: "HistoryBuff",
    rating: 5,
    comment: "Changed how I see human history. Must read!",
    createdAt: "2026-01-07",
  },
];

const initialBorrowRecords: BorrowRecord[] = [
  {
    id: "1",
    bookId: "3",
    bookTitle: "Steve Jobs",
    borrowerName: "Ahmed Hassan",
    borrowerClass: "10A",
    borrowedDate: "2026-01-10",
    returnDate: "2026-01-24",
    isReturned: false,
  },
  {
    id: "2",
    bookId: "5",
    bookTitle: "Sapiens: A Brief History of Humankind",
    borrowerName: "Fatima Ali",
    borrowerClass: "9B",
    borrowedDate: "2026-01-08",
    returnDate: "2026-01-22",
    isReturned: false,
  },
];

const initialBookRequests: BookRequest[] = [];

// Local storage keys
const BOOKS_KEY = "library_books";
const REVIEWS_KEY = "library_reviews";
const BORROW_RECORDS_KEY = "library_borrow_records";
const BOOK_REQUESTS_KEY = "library_book_requests";
const ADMIN_SETTINGS_KEY = "library_admin_settings";

// Initialize data
export const initializeData = () => {
  if (!localStorage.getItem(BOOKS_KEY)) {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(initialBooks));
  }
  if (!localStorage.getItem(REVIEWS_KEY)) {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(initialReviews));
  }
  if (!localStorage.getItem(BORROW_RECORDS_KEY)) {
    localStorage.setItem(BORROW_RECORDS_KEY, JSON.stringify(initialBorrowRecords));
  }
  if (!localStorage.getItem(BOOK_REQUESTS_KEY)) {
    localStorage.setItem(BOOK_REQUESTS_KEY, JSON.stringify(initialBookRequests));
  }
  if (!localStorage.getItem(ADMIN_SETTINGS_KEY)) {
    localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify({ username: "msoelib", password: "alif" }));
  }
  // Always set dark mode
  document.documentElement.classList.add("dark");
};

// Books
export const getBooks = (): Book[] => {
  const data = localStorage.getItem(BOOKS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getBookById = (id: string): Book | undefined => {
  return getBooks().find(book => book.id === id);
};

export const addBook = (book: Omit<Book, "id" | "averageRating" | "totalReviews">) => {
  const books = getBooks();
  const newBook: Book = {
    ...book,
    id: Date.now().toString(),
    averageRating: 0,
    totalReviews: 0,
  };
  books.push(newBook);
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
  return newBook;
};

export const updateBook = (id: string, updates: Partial<Book>) => {
  const books = getBooks();
  const index = books.findIndex(book => book.id === id);
  if (index !== -1) {
    books[index] = { ...books[index], ...updates };
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
  }
};

export const deleteBook = (id: string) => {
  const books = getBooks().filter(book => book.id !== id);
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
};

export const bulkDeleteBooks = (fromSi: string, toSi: string) => {
  const books = getBooks();
  const fromNum = parseInt(fromSi, 10);
  const toNum = parseInt(toSi, 10);
  
  const filteredBooks = books.filter(book => {
    const siNum = parseInt(book.siNumber, 10);
    if (isNaN(siNum)) return true;
    return siNum < fromNum || siNum > toNum;
  });
  
  const deletedCount = books.length - filteredBooks.length;
  localStorage.setItem(BOOKS_KEY, JSON.stringify(filteredBooks));
  return deletedCount;
};

export const bulkAddBooks = (books: Omit<Book, "id" | "averageRating" | "totalReviews">[]) => {
  const existingBooks = getBooks();
  const newBooks = books.map(book => ({
    ...book,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    averageRating: 0,
    totalReviews: 0,
  }));
  localStorage.setItem(BOOKS_KEY, JSON.stringify([...existingBooks, ...newBooks]));
};

// Reviews
export const getReviews = (bookId?: string): Review[] => {
  const data = localStorage.getItem(REVIEWS_KEY);
  const reviews: Review[] = data ? JSON.parse(data) : [];
  return bookId ? reviews.filter(r => r.bookId === bookId) : reviews;
};

export const addReview = (review: Omit<Review, "id" | "createdAt">) => {
  const reviews = getReviews();
  const newReview: Review = {
    ...review,
    id: Date.now().toString(),
    createdAt: new Date().toISOString().split("T")[0],
  };
  reviews.push(newReview);
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  
  // Update book rating
  const bookReviews = reviews.filter(r => r.bookId === review.bookId);
  const avgRating = bookReviews.reduce((sum, r) => sum + r.rating, 0) / bookReviews.length;
  updateBook(review.bookId, { averageRating: avgRating, totalReviews: bookReviews.length });
  
  return newReview;
};

// Borrow Records
export const getBorrowRecords = (): BorrowRecord[] => {
  const data = localStorage.getItem(BORROW_RECORDS_KEY);
  return data ? JSON.parse(data) : [];
};

export const addBorrowRecord = (record: Omit<BorrowRecord, "id">) => {
  const records = getBorrowRecords();
  const newRecord: BorrowRecord = {
    ...record,
    id: Date.now().toString(),
  };
  records.push(newRecord);
  localStorage.setItem(BORROW_RECORDS_KEY, JSON.stringify(records));
  
  // Update book status
  updateBook(record.bookId, {
    isBorrowed: true,
    borrowedBy: record.borrowerName,
    borrowedDate: record.borrowedDate,
    returnDate: record.returnDate,
  });
  
  return newRecord;
};

export const updateBorrowRecord = (id: string, updates: Partial<BorrowRecord>) => {
  const records = getBorrowRecords();
  const index = records.findIndex(r => r.id === id);
  if (index !== -1) {
    records[index] = { ...records[index], ...updates };
    localStorage.setItem(BORROW_RECORDS_KEY, JSON.stringify(records));
    
    if (updates.isReturned) {
      updateBook(records[index].bookId, {
        isBorrowed: false,
        borrowedBy: undefined,
        borrowedDate: undefined,
        returnDate: undefined,
      });
    }
  }
};

export const deleteBorrowRecord = (id: string) => {
  const records = getBorrowRecords();
  const record = records.find(r => r.id === id);
  if (record) {
    updateBook(record.bookId, {
      isBorrowed: false,
      borrowedBy: undefined,
      borrowedDate: undefined,
      returnDate: undefined,
    });
  }
  const filteredRecords = records.filter(r => r.id !== id);
  localStorage.setItem(BORROW_RECORDS_KEY, JSON.stringify(filteredRecords));
};

// Book Requests
export const getBookRequests = (): BookRequest[] => {
  const data = localStorage.getItem(BOOK_REQUESTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const addBookRequest = (request: Omit<BookRequest, "id" | "requestDate" | "status">) => {
  const requests = getBookRequests();
  const newRequest: BookRequest = {
    ...request,
    id: Date.now().toString(),
    requestDate: new Date().toISOString().split("T")[0],
    status: "pending",
  };
  requests.push(newRequest);
  localStorage.setItem(BOOK_REQUESTS_KEY, JSON.stringify(requests));
  return newRequest;
};

export const updateBookRequest = (id: string, updates: Partial<BookRequest>) => {
  const requests = getBookRequests();
  const index = requests.findIndex(r => r.id === id);
  if (index !== -1) {
    requests[index] = { ...requests[index], ...updates };
    localStorage.setItem(BOOK_REQUESTS_KEY, JSON.stringify(requests));
  }
};

export const deleteBookRequest = (id: string) => {
  const requests = getBookRequests().filter(r => r.id !== id);
  localStorage.setItem(BOOK_REQUESTS_KEY, JSON.stringify(requests));
};

// Admin Settings
export const getAdminSettings = (): AdminSettings => {
  const data = localStorage.getItem(ADMIN_SETTINGS_KEY);
  return data ? JSON.parse(data) : { username: "msoelib", password: "alif" };
};

export const updateAdminPassword = (newPassword: string) => {
  const settings = getAdminSettings();
  settings.password = newPassword;
  localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings));
};

export const validateAdmin = (username: string, password: string): boolean => {
  const settings = getAdminSettings();
  return settings.username === username && settings.password === password;
};
