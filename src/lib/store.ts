import { supabase } from "@/integrations/supabase/client";
import { Book, Review, BorrowRecord, BookRequest, AdminSettings, Student } from "./types";

// Initialize data - now just ensures dark mode
export const initializeData = () => {
  document.documentElement.classList.add("dark");
};

// Books - Database operations
export const getBooks = async (): Promise<Book[]> => {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("average_rating", { ascending: false });

  if (error) {
    console.error("Error fetching books:", error);
    return [];
  }

  return data.map((book) => ({
    id: book.id,
    siNumber: book.si_number,
    title: book.title,
    author: book.author,
    category: book.category,
    numberCode: book.number_code,
    description: book.description || undefined,
    coverImage: book.cover_image || undefined,
    volume: book.volume || undefined,
    pages: book.pages || undefined,
    publication: book.publication || undefined,
    isBorrowed: book.is_borrowed,
    borrowedBy: book.borrowed_by || undefined,
    borrowedDate: book.borrowed_date || undefined,
    returnDate: book.return_date || undefined,
    averageRating: Number(book.average_rating),
    totalReviews: book.total_reviews,
  }));
};

export const getBookById = async (id: string): Promise<Book | undefined> => {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    console.error("Error fetching book:", error);
    return undefined;
  }

  return {
    id: data.id,
    siNumber: data.si_number,
    title: data.title,
    author: data.author,
    category: data.category,
    numberCode: data.number_code,
    description: data.description || undefined,
    coverImage: data.cover_image || undefined,
    volume: data.volume || undefined,
    pages: data.pages || undefined,
    publication: data.publication || undefined,
    isBorrowed: data.is_borrowed,
    borrowedBy: data.borrowed_by || undefined,
    borrowedDate: data.borrowed_date || undefined,
    returnDate: data.return_date || undefined,
    averageRating: Number(data.average_rating),
    totalReviews: data.total_reviews,
  };
};

export const addBook = async (book: Omit<Book, "id" | "averageRating" | "totalReviews">): Promise<Book | null> => {
  const { data, error } = await supabase
    .from("books")
    .insert({
      si_number: book.siNumber,
      title: book.title,
      author: book.author,
      category: book.category,
      number_code: book.numberCode,
      description: book.description,
      cover_image: book.coverImage,
      volume: book.volume,
      pages: book.pages,
      publication: book.publication,
      is_borrowed: book.isBorrowed,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("Error adding book:", error);
    return null;
  }

  return {
    id: data.id,
    siNumber: data.si_number,
    title: data.title,
    author: data.author,
    category: data.category,
    numberCode: data.number_code,
    description: data.description || undefined,
    coverImage: data.cover_image || undefined,
    volume: data.volume || undefined,
    pages: data.pages || undefined,
    publication: data.publication || undefined,
    isBorrowed: data.is_borrowed,
    averageRating: Number(data.average_rating),
    totalReviews: data.total_reviews,
  };
};

export const updateBook = async (id: string, updates: Partial<Book>) => {
  const dbUpdates: Record<string, unknown> = {};
  
  if (updates.siNumber !== undefined) dbUpdates.si_number = updates.siNumber;
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.author !== undefined) dbUpdates.author = updates.author;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.numberCode !== undefined) dbUpdates.number_code = updates.numberCode;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.coverImage !== undefined) dbUpdates.cover_image = updates.coverImage;
  if (updates.volume !== undefined) dbUpdates.volume = updates.volume;
  if (updates.pages !== undefined) dbUpdates.pages = updates.pages;
  if (updates.publication !== undefined) dbUpdates.publication = updates.publication;
  if (updates.isBorrowed !== undefined) dbUpdates.is_borrowed = updates.isBorrowed;
  if (updates.borrowedBy !== undefined) dbUpdates.borrowed_by = updates.borrowedBy;
  if (updates.borrowedDate !== undefined) dbUpdates.borrowed_date = updates.borrowedDate;
  if (updates.returnDate !== undefined) dbUpdates.return_date = updates.returnDate;

  const { error } = await supabase
    .from("books")
    .update(dbUpdates)
    .eq("id", id);

  if (error) {
    console.error("Error updating book:", error);
  }
};

export const deleteBook = async (id: string) => {
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) {
    console.error("Error deleting book:", error);
  }
};

export const bulkDeleteBooks = async (fromSi: string, toSi: string): Promise<number> => {
  const { data: books, error: fetchError } = await supabase
    .from("books")
    .select("id, si_number");

  if (fetchError || !books) {
    console.error("Error fetching books for bulk delete:", fetchError);
    return 0;
  }

  const fromNum = parseInt(fromSi, 10);
  const toNum = parseInt(toSi, 10);

  const booksToDelete = books.filter((book) => {
    const siNum = parseInt(book.si_number, 10);
    return !isNaN(siNum) && siNum >= fromNum && siNum <= toNum;
  });

  if (booksToDelete.length === 0) return 0;

  const idsToDelete = booksToDelete.map((b) => b.id);
  const { error } = await supabase.from("books").delete().in("id", idsToDelete);

  if (error) {
    console.error("Error bulk deleting books:", error);
    return 0;
  }

  return booksToDelete.length;
};

export const bulkAddBooks = async (books: Omit<Book, "id" | "averageRating" | "totalReviews">[]) => {
  const dbBooks = books.map((book) => ({
    si_number: book.siNumber,
    title: book.title,
    author: book.author,
    category: book.category,
    number_code: book.numberCode,
    description: book.description,
    cover_image: book.coverImage,
    volume: book.volume,
    pages: book.pages,
    publication: book.publication,
    is_borrowed: book.isBorrowed,
  }));

  const { error } = await supabase.from("books").insert(dbBooks);

  if (error) {
    console.error("Error bulk adding books:", error);
  }
};

// Reviews
export const getReviews = async (bookId?: string): Promise<Review[]> => {
  let query = supabase.from("reviews").select("*");

  if (bookId) {
    query = query.eq("book_id", bookId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }

  return data.map((review) => ({
    id: review.id,
    bookId: review.book_id,
    userName: review.user_name,
    rating: review.rating,
    comment: review.comment || "",
    createdAt: review.created_at,
  }));
};

export const addReview = async (review: Omit<Review, "id" | "createdAt">): Promise<Review | null> => {
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      book_id: review.bookId,
      user_name: review.userName,
      rating: review.rating,
      comment: review.comment,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("Error adding review:", error);
    return null;
  }

  return {
    id: data.id,
    bookId: data.book_id,
    userName: data.user_name,
    rating: data.rating,
    comment: data.comment || "",
    createdAt: data.created_at,
  };
};

export const deleteReview = async (id: string) => {
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) {
    console.error("Error deleting review:", error);
  }
};

// Borrow Records
export const getBorrowRecords = async (): Promise<BorrowRecord[]> => {
  const { data, error } = await supabase
    .from("borrow_records")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching borrow records:", error);
    return [];
  }

  return data.map((record) => ({
    id: record.id,
    bookId: record.book_id,
    bookTitle: record.book_title,
    bookVolume: record.book_volume || undefined,
    borrowerName: record.borrower_name,
    borrowerClass: record.borrower_class || undefined,
    borrowedDate: record.borrowed_date,
    returnDate: record.return_date,
    isReturned: record.is_returned,
  }));
};

export const addBorrowRecord = async (record: Omit<BorrowRecord, "id">): Promise<BorrowRecord | null> => {
  const { data, error } = await supabase
    .from("borrow_records")
    .insert({
      book_id: record.bookId,
      book_title: record.bookTitle,
      book_volume: record.bookVolume,
      borrower_name: record.borrowerName,
      borrower_class: record.borrowerClass,
      borrowed_date: record.borrowedDate,
      return_date: record.returnDate,
      is_returned: record.isReturned,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("Error adding borrow record:", error);
    return null;
  }

  // Update book status
  await updateBook(record.bookId, {
    isBorrowed: true,
    borrowedBy: record.borrowerName,
    borrowedDate: record.borrowedDate,
    returnDate: record.returnDate,
  });

  return {
    id: data.id,
    bookId: data.book_id,
    bookTitle: data.book_title,
    bookVolume: data.book_volume || undefined,
    borrowerName: data.borrower_name,
    borrowerClass: data.borrower_class || undefined,
    borrowedDate: data.borrowed_date,
    returnDate: data.return_date,
    isReturned: data.is_returned,
  };
};

export const updateBorrowRecord = async (id: string, updates: Partial<BorrowRecord>) => {
  const dbUpdates: Record<string, unknown> = {};

  if (updates.borrowerName !== undefined) dbUpdates.borrower_name = updates.borrowerName;
  if (updates.borrowerClass !== undefined) dbUpdates.borrower_class = updates.borrowerClass;
  if (updates.borrowedDate !== undefined) dbUpdates.borrowed_date = updates.borrowedDate;
  if (updates.returnDate !== undefined) dbUpdates.return_date = updates.returnDate;
  if (updates.isReturned !== undefined) dbUpdates.is_returned = updates.isReturned;

  const { data: record, error: fetchError } = await supabase
    .from("borrow_records")
    .select("book_id")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("borrow_records").update(dbUpdates).eq("id", id);

  if (error) {
    console.error("Error updating borrow record:", error);
    return;
  }

  if (updates.isReturned && record) {
    await updateBook(record.book_id, {
      isBorrowed: false,
      borrowedBy: undefined,
      borrowedDate: undefined,
      returnDate: undefined,
    });
  }
};

export const deleteBorrowRecord = async (id: string) => {
  const { data: record, error: fetchError } = await supabase
    .from("borrow_records")
    .select("book_id")
    .eq("id", id)
    .single();

  if (record) {
    await updateBook(record.book_id, {
      isBorrowed: false,
      borrowedBy: undefined,
      borrowedDate: undefined,
      returnDate: undefined,
    });
  }

  const { error } = await supabase.from("borrow_records").delete().eq("id", id);
  if (error) {
    console.error("Error deleting borrow record:", error);
  }
};

// Book Requests
export const getBookRequests = async (): Promise<BookRequest[]> => {
  const { data, error } = await supabase
    .from("book_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching book requests:", error);
    return [];
  }

  return data.map((request) => ({
    id: request.id,
    bookId: request.book_id,
    bookTitle: request.book_title,
    bookNumberCode: request.book_number_code,
    bookVolume: request.book_volume || undefined,
    requesterName: request.requester_name,
    requesterClass: request.requester_class,
    requestDate: request.request_date,
    status: request.status as "pending" | "approved" | "rejected",
  }));
};

export const addBookRequest = async (request: Omit<BookRequest, "id" | "requestDate" | "status">): Promise<BookRequest | null> => {
  const { data, error } = await supabase
    .from("book_requests")
    .insert({
      book_id: request.bookId,
      book_title: request.bookTitle,
      book_number_code: request.bookNumberCode,
      book_volume: request.bookVolume,
      requester_name: request.requesterName,
      requester_class: request.requesterClass,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("Error adding book request:", error);
    return null;
  }

  return {
    id: data.id,
    bookId: data.book_id,
    bookTitle: data.book_title,
    bookNumberCode: data.book_number_code,
    bookVolume: data.book_volume || undefined,
    requesterName: data.requester_name,
    requesterClass: data.requester_class,
    requestDate: data.request_date,
    status: data.status as "pending" | "approved" | "rejected",
  };
};

export const updateBookRequest = async (id: string, updates: Partial<BookRequest>) => {
  const dbUpdates: Record<string, unknown> = {};

  if (updates.status !== undefined) dbUpdates.status = updates.status;

  const { error } = await supabase.from("book_requests").update(dbUpdates).eq("id", id);

  if (error) {
    console.error("Error updating book request:", error);
  }
};

export const deleteBookRequest = async (id: string) => {
  const { error } = await supabase.from("book_requests").delete().eq("id", id);
  if (error) {
    console.error("Error deleting book request:", error);
  }
};

// Admin Settings
export const getAdminSettings = async (): Promise<AdminSettings> => {
  const { data, error } = await supabase
    .from("admin_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    console.error("Error fetching admin settings:", error);
    return { username: "msoelib", password: "alif" };
  }

  return {
    username: data.username,
    password: data.password,
  };
};

export const updateAdminPassword = async (newPassword: string) => {
  const { error } = await supabase
    .from("admin_settings")
    .update({ password: newPassword })
    .eq("username", "msoelib");

  if (error) {
    console.error("Error updating admin password:", error);
  }
};

export const validateAdmin = async (username: string, password: string): Promise<boolean> => {
  const settings = await getAdminSettings();
  return settings.username === username && settings.password === password;
};

// Students
export const getStudents = async (): Promise<Student[]> => {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching students:", error);
    return [];
  }

  return data.map((student) => ({
    id: student.id,
    name: student.name,
    class: student.class,
    createdAt: student.created_at,
    updatedAt: student.updated_at,
  }));
};

export const addStudent = async (student: Omit<Student, "id" | "createdAt" | "updatedAt">): Promise<Student | null> => {
  const { data, error } = await supabase
    .from("students")
    .insert({
      name: student.name,
      class: student.class,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("Error adding student:", error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    class: data.class,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

export const bulkAddStudents = async (students: Omit<Student, "id" | "createdAt" | "updatedAt">[]) => {
  const dbStudents = students.map((student) => ({
    name: student.name,
    class: student.class,
  }));

  const { error } = await supabase.from("students").insert(dbStudents);

  if (error) {
    console.error("Error bulk adding students:", error);
  }
};

export const deleteStudent = async (id: string) => {
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) {
    console.error("Error deleting student:", error);
  }
};

export const bulkDeleteStudents = async (ids: string[]): Promise<number> => {
  if (ids.length === 0) return 0;

  const { error } = await supabase.from("students").delete().in("id", ids);

  if (error) {
    console.error("Error bulk deleting students:", error);
    return 0;
  }

  return ids.length;
};

export const searchStudents = async (query: string): Promise<Student[]> => {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .or(`name.ilike.%${query}%,class.ilike.%${query}%`)
    .order("name", { ascending: true })
    .limit(20);

  if (error) {
    console.error("Error searching students:", error);
    return [];
  }

  return data.map((student) => ({
    id: student.id,
    name: student.name,
    class: student.class,
    createdAt: student.created_at,
    updatedAt: student.updated_at,
  }));
};
