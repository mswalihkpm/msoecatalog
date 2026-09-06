import { supabase } from "@/integrations/supabase/client";
import { Book, Review, BorrowRecord, BookRequest, AdminSettings, Student, LeaderboardSnapshot, ReadStatus, ScoringTable, CreativeWork } from "./types";


// Initialize data - now just ensures dark mode
export const initializeData = () => {
  const stored = localStorage.getItem("theme");
  if (stored === "light") {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  } else if (stored === "dark") {
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
  } else {
    // Default to light
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    localStorage.setItem("theme", "light");
  }
};

// Books - Database operations
export const getBooks = async (): Promise<Book[]> => {
  // Fetch all books in batches to overcome the 1000-row default limit
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .order("average_rating", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error("Error fetching books:", error);
      return allData.length > 0 ? allData.map(mapBook) : [];
    }

    allData = allData.concat(data);
    hasMore = data.length === PAGE_SIZE;
    from += PAGE_SIZE;
  }

  const data = allData;

  function mapBook(book: any) {
    return {
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
      averageRating: book.average_rating,
      totalReviews: book.total_reviews,
    };
  }

  return data.map(mapBook);
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
  // Fetch ALL books in batches (default 1000-row limit otherwise truncates results)
  const PAGE_SIZE = 1000;
  let allBooks: { id: string; si_number: string }[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("books")
      .select("id, si_number")
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error("Error fetching books for bulk delete:", error);
      return 0;
    }

    allBooks = allBooks.concat(data || []);
    hasMore = (data?.length || 0) === PAGE_SIZE;
    from += PAGE_SIZE;
  }

  const fromNum = parseInt(fromSi, 10);
  const toNum = parseInt(toSi, 10);

  const booksToDelete = allBooks.filter((book) => {
    const siNum = parseInt(book.si_number, 10);
    return !isNaN(siNum) && siNum >= fromNum && siNum <= toNum;
  });

  if (booksToDelete.length === 0) return 0;

  const idsToDelete = booksToDelete.map((b) => b.id);
  // Delete in chunks to avoid URL/payload limits
  const CHUNK = 200;
  let deleted = 0;
  for (let i = 0; i < idsToDelete.length; i += CHUNK) {
    const slice = idsToDelete.slice(i, i + CHUNK);
    const { error } = await supabase.from("books").delete().in("id", slice);
    if (error) {
      console.error("Error bulk deleting books chunk:", error);
      break;
    }
    deleted += slice.length;
  }

  return deleted;
};

export const getStudentPendingRequestForBook = async (
  studentName: string,
  bookId: string
): Promise<{ id: string } | null> => {
  const { data, error } = await supabase
    .from("book_requests")
    .select("id")
    .eq("requester_name", studentName)
    .eq("book_id", bookId)
    .eq("status", "pending")
    .maybeSingle();
  if (error) {
    console.error("Error fetching student pending request:", error);
    return null;
  }
  return data ? { id: data.id } : null;
};

export const bulkAddBooks = async (books: Omit<Book, "id" | "averageRating" | "totalReviews">[]): Promise<number> => {
  if (!books || books.length === 0) return 0;

  // Keep each chunk safely below the 1000-row per-request limit. 500 is conservative.
  const CHUNK_SIZE = 500;
  let insertedCount = 0;

  try {
    for (let i = 0; i < books.length; i += CHUNK_SIZE) {
      const chunk = books.slice(i, i + CHUNK_SIZE);

      const dbBooks = chunk.map((book) => ({
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

      // Use .select() so Supabase returns inserted rows (when available)
      const { data, error } = await supabase.from("books").insert(dbBooks).select();

      if (error) {
        console.error("Error bulk adding books (chunk):", error);
        // Stop on first error and return what was inserted so far.
        break;
      }

      if (Array.isArray(data)) {
        insertedCount += data.length;
      } else {
        // If the server doesn't return rows, assume the chunk was inserted
        insertedCount += dbBooks.length;
      }
    }
  } catch (err) {
    console.error("Unexpected error in bulkAddBooks:", err);
  }

  return insertedCount;
};

// Reviews
export type ReviewStatus = "pending" | "approved" | "hidden";

const mapReview = (review: any): Review => ({
  id: review.id,
  bookId: review.book_id,
  userName: review.user_name,
  rating: review.rating,
  comment: review.comment || "",
  createdAt: review.created_at,
  status: (review.status || "approved") as ReviewStatus,
  helpfulCount: review.helpful_count ?? 0,
});

export const getReviews = async (
  bookId?: string,
  status?: ReviewStatus | "all"
): Promise<Review[]> => {
  let query = supabase.from("reviews").select("*");

  if (bookId) {
    query = query.eq("book_id", bookId);
  }
  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }

  return data.map(mapReview);
};

export const addReview = async (review: Omit<Review, "id" | "createdAt" | "status" | "helpfulCount">): Promise<Review | null> => {
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      book_id: review.bookId,
      user_name: review.userName,
      rating: review.rating,
      comment: review.comment,
      status: "pending",
      student_id: review.studentId || null,
    } as any)
    .select()
    .single();

  if (error || !data) {
    console.error("Error adding review:", error);
    return null;
  }

  return mapReview(data);
};

export const updateReviewStatus = async (id: string, status: ReviewStatus) => {
  const { error } = await supabase.from("reviews").update({ status } as any).eq("id", id);
  if (error) console.error("Error updating review status:", error);
};

export const bulkUpdateReviewStatus = async (ids: string[], status: ReviewStatus) => {
  if (!ids.length) return;
  const { error } = await supabase.from("reviews").update({ status } as any).in("id", ids);
  if (error) console.error("Error bulk updating review status:", error);
};

export const deleteReview = async (id: string) => {
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) {
    console.error("Error deleting review:", error);
  }
};

// Helpful votes
const VOTER_KEY_STORAGE = "review_voter_key";
export const getVoterKey = (): string => {
  let key = localStorage.getItem(VOTER_KEY_STORAGE);
  if (!key) {
    key = `v_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    localStorage.setItem(VOTER_KEY_STORAGE, key);
  }
  return key;
};

export const voteReviewHelpful = async (reviewId: string) => {
  const { error } = await supabase
    .from("review_votes")
    .insert({ review_id: reviewId, voter_key: getVoterKey() } as any);
  if (error) console.error("Error voting review:", error);
};

export const removeReviewVote = async (reviewId: string) => {
  const { error } = await supabase
    .from("review_votes")
    .delete()
    .eq("review_id", reviewId)
    .eq("voter_key", getVoterKey());
  if (error) console.error("Error removing vote:", error);
};

export const getMyVotedReviewIds = async (reviewIds: string[]): Promise<string[]> => {
  if (!reviewIds.length) return [];
  const { data, error } = await supabase
    .from("review_votes")
    .select("review_id")
    .eq("voter_key", getVoterKey())
    .in("review_id", reviewIds);
  if (error || !data) return [];
  return data.map((v: any) => v.review_id);
};

/** Reviewer badge stats computed from approved reviews. */
export const getReviewerStats = async (): Promise<Record<string, { count: number; helpful: number }>> => {
  const { data, error } = await supabase
    .from("reviews")
    .select("user_name, helpful_count, status")
    .eq("status", "approved");
  if (error || !data) return {};
  const stats: Record<string, { count: number; helpful: number }> = {};
  for (const r of data as any[]) {
    if (!r.user_name || r.user_name === "Anonymous") continue;
    const s = stats[r.user_name] || { count: 0, helpful: 0 };
    s.count += 1;
    s.helpful += r.helpful_count ?? 0;
    stats[r.user_name] = s;
  }
  return stats;
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

  return data.map((record: any) => ({
    id: record.id,
    bookId: record.book_id,
    bookTitle: record.book_title,
    bookVolume: record.book_volume || undefined,
    borrowerName: record.borrower_name,
    borrowerClass: record.borrower_class || undefined,
    borrowedDate: record.borrowed_date,
    returnDate: record.return_date,
    isReturned: record.is_returned,
    readStatus: (record.read_status as ReadStatus) || "not_read",
    reviewConducted: !!record.review_conducted,
    reviewPoints: record.review_points ?? undefined,
    studentId: record.student_id || undefined,
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
      student_id: record.studentId || null,
    } as any)
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
    readStatus: ((data as any).read_status as ReadStatus) || "not_read",
    reviewConducted: !!(data as any).review_conducted,
  };
};


export const updateBorrowRecord = async (id: string, updates: Partial<BorrowRecord>) => {
  const dbUpdates: Record<string, unknown> = {};

  if (updates.borrowerName !== undefined) dbUpdates.borrower_name = updates.borrowerName;
  if (updates.borrowerClass !== undefined) dbUpdates.borrower_class = updates.borrowerClass;
  if (updates.borrowedDate !== undefined) dbUpdates.borrowed_date = updates.borrowedDate;
  if (updates.returnDate !== undefined) dbUpdates.return_date = updates.returnDate;
  if (updates.isReturned !== undefined) dbUpdates.is_returned = updates.isReturned;
  if ((updates as any).readStatus !== undefined) dbUpdates.read_status = (updates as any).readStatus;
  if ((updates as any).reviewConducted !== undefined) dbUpdates.review_conducted = (updates as any).reviewConducted;
  if ((updates as any).reviewPoints !== undefined) dbUpdates.review_points = (updates as any).reviewPoints;

  const { data: record } = await supabase
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
    returnDate: (request as any).return_date || undefined,
    status: request.status as "pending" | "approved" | "rejected",
    studentId: (request as any).student_id || undefined,
  }));
};


export const getStudentPendingRequestCount = async (studentName: string): Promise<number> => {
  const { count, error } = await supabase
    .from("book_requests")
    .select("*", { count: "exact", head: true })
    .eq("requester_name", studentName)
    .eq("status", "pending");
  if (error) {
    console.error("Error counting student pending requests:", error);
    return 0;
  }
  return count || 0;
};

export const getPendingRequestCount = async (bookId: string): Promise<number> => {
  const { count, error } = await supabase
    .from("book_requests")
    .select("*", { count: "exact", head: true })
    .eq("book_id", bookId)
    .eq("status", "pending");
  if (error) {
    console.error("Error counting pending requests:", error);
    return 0;
  }
  return count || 0;
};

export const addBookRequest = async (
  request: Omit<BookRequest, "id" | "requestDate" | "status">,
  initialStatus: BookRequest["status"] = "pending"
): Promise<BookRequest | null> => {
  const insertData: Record<string, unknown> = {
    book_id: request.bookId,
    book_title: request.bookTitle,
    book_number_code: request.bookNumberCode,
    book_volume: request.bookVolume,
    requester_name: request.requesterName,
    requester_class: request.requesterClass,
    status: initialStatus,
    student_id: request.studentId || null,
  };
  if (request.returnDate) {
    insertData.return_date = request.returnDate;
  }
  const { data, error } = await supabase
    .from("book_requests")
    .insert(insertData as any)
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
    returnDate: (data as any).return_date || undefined,
    status: data.status as BookRequest["status"],
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
    return {
      username: "msoelib",
      password: "alif",
      libraryOpenDay: 0,
      leaderboardNotice: "",
      leaderboardVisible: true,
    };
  }

  return {
    username: data.username,
    password: data.password,
    libraryOpenDay: data.library_open_day ?? 0,
    libraryOpenDate: (data as any).library_open_date || undefined,
    leaderboardNotice: (data as any).leaderboard_notice || "",
    leaderboardVisible: (data as any).leaderboard_visible ?? true,
    leaderboardVisibleUntil: (data as any).leaderboard_visible_until || undefined,
    leaderboardVisibleFrom: (data as any).leaderboard_visible_from || undefined,
    leaderboardFromDate: (data as any).leaderboard_from_date || undefined,
    scoringTable: (data as any).scoring_table || undefined,
    reviewPointsDefault: (data as any).review_points_default ?? 10,
    creativityCategories: Array.isArray((data as any).creativity_categories) ? (data as any).creativity_categories : [],
  };
};

export const updateLibraryOpenDay = async (day: number) => {
  const { error } = await supabase
    .from("admin_settings")
    .update({ library_open_day: day } as any)
    .eq("username", "msoelib");
  if (error) console.error("Error updating library open day:", error);
};

export const updateLibraryOpenDate = async (date: string) => {
  const { error } = await supabase
    .from("admin_settings")
    .update({ library_open_date: date } as any)
    .eq("username", "msoelib");
  if (error) console.error("Error updating library open date:", error);
};

export const updateAdminPassword = async (newPassword: string) => {
  const { error } = await supabase
    .from("admin_settings")
    .update({ password: newPassword })
    .eq("username", "msoelib");
  if (error) console.error("Error updating admin password:", error);
};

export const updateLeaderboardSettings = async (
  updates: Partial<Pick<AdminSettings, "leaderboardNotice" | "leaderboardVisible" | "leaderboardVisibleUntil" | "leaderboardVisibleFrom" | "leaderboardFromDate">>,
) => {
  const db: Record<string, unknown> = {};
  if (updates.leaderboardNotice !== undefined) db.leaderboard_notice = updates.leaderboardNotice;
  if (updates.leaderboardVisible !== undefined) db.leaderboard_visible = updates.leaderboardVisible;
  if (updates.leaderboardVisibleUntil !== undefined) db.leaderboard_visible_until = updates.leaderboardVisibleUntil || null;
  if (updates.leaderboardVisibleFrom !== undefined) db.leaderboard_visible_from = updates.leaderboardVisibleFrom || null;
  if (updates.leaderboardFromDate !== undefined) db.leaderboard_from_date = updates.leaderboardFromDate || null;
  const { error } = await supabase.from("admin_settings").update(db as any).eq("username", "msoelib");
  if (error) console.error("Error updating leaderboard settings:", error);
};

export const updateCreativityCategories = async (categories: string[]) => {
  const { error } = await supabase
    .from("admin_settings")
    .update({ creativity_categories: categories } as any)
    .eq("username", "msoelib");
  if (error) console.error("Error updating creativity categories:", error);
};

export const migrateStudentAccount = async (oldId: string, newId: string): Promise<{ ok: boolean; error?: string }> => {
  const { error } = await supabase.rpc("migrate_student" as any, { old_id: oldId, new_id: newId } as any);
  if (error) { console.error("migrate_student error:", error); return { ok: false, error: error.message }; }
  return { ok: true };
};

export const validateAdmin = async (username: string, password: string): Promise<boolean> => {
  const settings = await getAdminSettings();
  return settings.username === username && settings.password === password;
};

// Leaderboard snapshots
export const getLeaderboardSnapshots = async (): Promise<LeaderboardSnapshot[]> => {
  const { data, error } = await supabase
    .from("leaderboard_snapshots" as any)
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as any[]).map((s) => ({
    id: s.id,
    name: s.name,
    fromDate: s.from_date || undefined,
    untilDate: s.until_date || undefined,
    notice: s.notice || "",
    entries: Array.isArray(s.entries) ? s.entries : [],
    createdAt: s.created_at,
  }));
};

export const addLeaderboardSnapshot = async (snap: Omit<LeaderboardSnapshot, "id" | "createdAt">) => {
  const { error } = await supabase.from("leaderboard_snapshots" as any).insert({
    name: snap.name,
    from_date: snap.fromDate || null,
    until_date: snap.untilDate || null,
    notice: snap.notice || "",
    entries: snap.entries as any,
  });
  if (error) console.error("Error saving snapshot:", error);
};

export const deleteLeaderboardSnapshot = async (id: string) => {
  const { error } = await supabase.from("leaderboard_snapshots" as any).delete().eq("id", id);
  if (error) console.error("Error deleting snapshot:", error);
};


// Students
const mapStudent = (student: any): Student => ({
  id: student.id,
  name: student.name,
  class: student.class,
  code: student.code || '',
  houseName: student.house_name || undefined,
  fatherName: student.father_name || undefined,
  dateOfBirth: student.date_of_birth || undefined,
  sprStudentId: student.spr_student_id || undefined,
  studentType: (student.student_type as any) || "new",
  migratedFrom: student.migrated_from || undefined,
  createdAt: student.created_at,
  updatedAt: student.updated_at,
});

export const getStudents = async (): Promise<Student[]> => {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .order("name", { ascending: true });
  if (error) { console.error("Error fetching students:", error); return []; }
  return data.map(mapStudent);
};

export const addStudent = async (student: Omit<Student, "id" | "createdAt" | "updatedAt">): Promise<Student | null> => {
  const { data, error } = await supabase
    .from("students")
    .insert({
      name: student.name,
      class: student.class,
      code: student.code || '000',
      house_name: student.houseName || null,
      father_name: student.fatherName || null,
      date_of_birth: student.dateOfBirth || null,
      spr_student_id: student.sprStudentId?.trim() || null,
    } as any)
    .select()
    .single();
  if (error || !data) { console.error("Error adding student:", error); return null; }
  return mapStudent(data);
};

export const bulkAddStudents = async (students: Omit<Student, "id" | "createdAt" | "updatedAt">[]): Promise<number> => {
  if (!students || students.length === 0) return 0;
  const CHUNK_SIZE = 500;
  let insertedCount = 0;
  try {
    for (let i = 0; i < students.length; i += CHUNK_SIZE) {
      const chunk = students.slice(i, i + CHUNK_SIZE);
      const dbStudents = chunk.map((student) => ({
        name: student.name,
        class: student.class,
        code: student.code || '000',
        house_name: student.houseName || null,
        father_name: student.fatherName || null,
        date_of_birth: student.dateOfBirth || null,
        spr_student_id: student.sprStudentId?.trim() || null,
      }));
      const { data, error } = await supabase.from("students").insert(dbStudents as any).select();
      if (error) { console.error("Error bulk adding students (chunk):", error); break; }
      insertedCount += Array.isArray(data) ? data.length : dbStudents.length;
    }
  } catch (err) { console.error("Unexpected error in bulkAddStudents:", err); }
  return insertedCount;
};

export const updateStudent = async (id: string, updates: Partial<Omit<Student, "id" | "createdAt" | "updatedAt">>) => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.class !== undefined) dbUpdates.class = updates.class;
  if (updates.code !== undefined) dbUpdates.code = updates.code;
  if (updates.houseName !== undefined) dbUpdates.house_name = updates.houseName || null;
  if (updates.fatherName !== undefined) dbUpdates.father_name = updates.fatherName || null;
  if (updates.dateOfBirth !== undefined) dbUpdates.date_of_birth = updates.dateOfBirth || null;
  if (updates.sprStudentId !== undefined) dbUpdates.spr_student_id = updates.sprStudentId?.trim() || null;
  const { error } = await supabase.from("students").update(dbUpdates).eq("id", id);
  if (error) console.error("Error updating student:", error);
  return error ? error.message : null;
};

export const deleteStudent = async (id: string) => {
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) console.error("Error deleting student:", error);
};

export const bulkDeleteStudents = async (ids: string[]): Promise<number> => {
  if (ids.length === 0) return 0;
  const { error } = await supabase.from("students").delete().in("id", ids);
  if (error) { console.error("Error bulk deleting students:", error); return 0; }
  return ids.length;
};

export const hasStudentRequestedBook = async (studentName: string, bookId: string): Promise<boolean> => {
  const { count, error } = await supabase
    .from("book_requests")
    .select("*", { count: "exact", head: true })
    .eq("requester_name", studentName)
    .eq("book_id", bookId)
    .eq("status", "pending");
  if (error) { console.error("Error checking student book request:", error); return false; }
  return (count ?? 0) > 0;
};

export const searchStudents = async (query: string): Promise<Student[]> => {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .or(`name.ilike.%${query}%,class.ilike.%${query}%`)
    .order("name", { ascending: true })
    .limit(20);
  if (error) { console.error("Error searching students:", error); return []; }
  return data.map(mapStudent);
};

const norm = (s?: string | null) => (s || "").trim().toUpperCase();

/** Look up a student's code using profile fields (forgot-passcode flow). */
export const lookupStudentPasscode = async (
  name: string,
  houseName: string,
  fatherName: string,
  dateOfBirth: string,
): Promise<string | null> => {
  const { data, error } = await supabase.from("students").select("*");
  if (error || !data) return null;
  const match = (data as any[]).find(
    (s) =>
      norm(s.name) === norm(name) &&
      norm(s.house_name) === norm(houseName) &&
      norm(s.father_name) === norm(fatherName) &&
      norm(s.date_of_birth) === norm(dateOfBirth),
  );
  return match ? (match.code || "000") : null;
};

// Publication Logos
export interface PublicationLogo {
  id: string;
  publicationName: string;
  logoUrl?: string;
}

export const getPublicationLogos = async (): Promise<PublicationLogo[]> => {
  const { data, error } = await supabase
    .from("publication_logos" as any)
    .select("*")
    .order("publication_name", { ascending: true });
  if (error || !data) { console.error("Error fetching publication logos:", error); return []; }
  return (data as any[]).map((d) => ({
    id: d.id,
    publicationName: d.publication_name,
    logoUrl: d.logo_url || undefined,
  }));
};

export const upsertPublicationLogo = async (publicationName: string, logoUrl: string | null) => {
  const { error } = await supabase
    .from("publication_logos" as any)
    .upsert({ publication_name: publicationName, logo_url: logoUrl }, { onConflict: "publication_name" });
  if (error) console.error("Error upserting publication logo:", error);
};

export const deletePublicationLogo = async (id: string) => {
  const { error } = await supabase.from("publication_logos" as any).delete().eq("id", id);
  if (error) console.error("Error deleting publication logo:", error);
};

export const verifyStudentCode = async (studentId: string, code: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from("students")
    .select("code")
    .eq("id", studentId)
    .maybeSingle();
  if (error || !data) return false;
  return (data as any).code === code;
};

// ============================================================
// Scoring Table (editable 14x7 grid stored in admin_settings)
// ============================================================
export const DEFAULT_SCORING_TABLE: ScoringTable = {
  Islamic:        { b50: 10, b100: 15, b150: 20, b200: 25, b250: 30, b300: 35, a300: 50 },
  General:        { b50: 8,  b100: 13, b150: 18, b200: 23, b250: 28, b300: 33, a300: 48 },
  Science:        { b50: 8,  b100: 13, b150: 17, b200: 22, b250: 27, b300: 32, a300: 47 },
  History:        { b50: 8,  b100: 13, b150: 17, b200: 22, b250: 27, b300: 32, a300: 47 },
  English:        { b50: 7,  b100: 12, b150: 17, b200: 22, b250: 27, b300: 32, a300: 47 },
  Autobiography:  { b50: 7,  b100: 12, b150: 17, b200: 23, b250: 28, b300: 33, a300: 48 },
  Biography:      { b50: 7,  b100: 12, b150: 17, b200: 23, b250: 28, b300: 33, a300: 48 },
  Travelogue:     { b50: 6,  b100: 11, b150: 16, b200: 21, b250: 26, b300: 31, a300: 46 },
  Arabic:         { b50: 6,  b100: 11, b150: 16, b200: 22, b250: 27, b300: 32, a300: 47 },
  Poem:           { b50: 5,  b100: 10, b150: 15, b200: 20, b250: 25, b300: 30, a300: 45 },
  "English Novel":{ b50: 5,  b100: 10, b150: 15, b200: 20, b250: 26, b300: 33, a300: 48 },
  Story:          { b50: 4,  b100: 9,  b150: 14, b200: 22, b250: 25, b300: 31, a300: 46 },
  Novel:          { b50: 4,  b100: 9,  b150: 14, b200: 22, b250: 25, b300: 32, a300: 47 },
  "English Story":{ b50: 3,  b100: 6,  b150: 10, b200: 15, b250: 24, b300: 35, a300: 40 },
  Language:       { b50: 6,  b100: 11, b150: 16, b200: 22, b250: 27, b300: 32, a300: 47 },
  Others:         { b50: 3,  b100: 6,  b150: 10, b200: 15, b250: 20, b300: 25, a300: 35 },
};

export const updateScoringTable = async (table: ScoringTable) => {
  const { error } = await supabase
    .from("admin_settings")
    .update({ scoring_table: table } as any)
    .eq("username", "msoelib");
  if (error) console.error("Error updating scoring table:", error);
};

export const updateReviewPointsDefault = async (points: number) => {
  const { error } = await supabase
    .from("admin_settings")
    .update({ review_points_default: points } as any)
    .eq("username", "msoelib");
  if (error) console.error("Error updating review points default:", error);
};

/** Return points for a book given its category and page count using a scoring table. */
export const pointsForBook = (
  table: ScoringTable,
  category: string | undefined,
  pages: string | number | undefined,
): number => {
  const catRow = (table[category || "Others"] || table.Others || {}) as Record<string, number>;
  const n = typeof pages === "number" ? pages : parseInt(String(pages || "0").replace(/[^\d]/g, ""), 10) || 0;
  let tier: string;
  if (n < 50) tier = "b50";
  else if (n < 100) tier = "b100";
  else if (n < 150) tier = "b150";
  else if (n < 200) tier = "b200";
  else if (n < 250) tier = "b250";
  else if (n <= 300) tier = "b300";
  else tier = "a300";
  return catRow[tier] ?? 0;
};

// ============================================================
// Creative Works (Creativity Hub)
// ============================================================
const CREATIVE_BUCKET = "creative-works";

const mapCreative = (row: any): CreativeWork => ({
  id: row.id,
  title: row.title,
  writer: row.writer || undefined,
  media: row.media || undefined,
  category: row.category || undefined,
  workDate: row.work_date,
  fileUrl: row.file_url,
  fileType: row.file_type,
  coverUrl: row.cover_url || undefined,
  createdAt: row.created_at,
});

export const getCreativeWorks = async (): Promise<CreativeWork[]> => {
  const { data, error } = await supabase
    .from("creative_works" as any)
    .select("*")
    .order("work_date", { ascending: false });
  if (error || !data) { console.error("Error fetching creative works:", error); return []; }
  return (data as any[]).map(mapCreative);
};

/** Upload a file with progress; onProgress reports 0..100. */
export const uploadCreativeFile = async (
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string | null> => {
  try {
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    // supabase-js v2 does not expose upload progress; simulate to keep UI responsive.
    let fake = 5;
    const timer = onProgress
      ? setInterval(() => {
          fake = Math.min(90, fake + Math.random() * 10);
          onProgress(fake);
        }, 250)
      : null;
    const { error } = await supabase.storage.from(CREATIVE_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (timer) clearInterval(timer);
    if (error) { console.error("Upload error:", error); return null; }
    // Try public URL first; fall back to signed URL for private buckets.
    const pub = supabase.storage.from(CREATIVE_BUCKET).getPublicUrl(path).data.publicUrl;
    let url: string = pub;
    if (!pub || pub.endsWith("/")) {
      const { data } = await supabase.storage
        .from(CREATIVE_BUCKET)
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      url = data?.signedUrl || pub;
    } else {
      // Test if public URL is accessible; if bucket is private, fall back to signed URL.
      const { data } = await supabase.storage
        .from(CREATIVE_BUCKET)
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      if (data?.signedUrl) url = data.signedUrl;
    }
    onProgress?.(100);
    return url;
  } catch (err) {
    console.error("uploadCreativeFile failed:", err);
    return null;
  }
};

export const addCreativeWork = async (work: Omit<CreativeWork, "id" | "createdAt">): Promise<CreativeWork | null> => {
  const { data, error } = await supabase
    .from("creative_works" as any)
    .insert({
      title: work.title,
      writer: work.writer || null,
      media: work.media || null,
      category: work.category || null,
      work_date: work.workDate,
      file_url: work.fileUrl,
      file_type: work.fileType,
      cover_url: work.coverUrl || null,
    })
    .select()
    .single();
  if (error || !data) { console.error("addCreativeWork error:", error); return null; }
  return mapCreative(data);
};

export const deleteCreativeWork = async (id: string) => {
  const { error } = await supabase.from("creative_works" as any).delete().eq("id", id);
  if (error) console.error("deleteCreativeWork error:", error);
};

