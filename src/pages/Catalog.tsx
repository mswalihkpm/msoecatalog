import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { BookCard } from "@/components/BookCard";
import { SearchFilters } from "@/components/SearchFilters";
import { Header } from "@/components/Header";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { PromoBanner } from "@/components/PromoBanner";
import { getBooks, initializeData, getBookRequests } from "@/lib/store";
import { Book } from "@/lib/types";
import { Library, BookOpen, TrendingUp, Star, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const BOOKS_PER_PAGE = 40;
const CATALOG_BROWSE_STATE_KEY = "catalogBrowseState";

type CatalogBrowseState = {
  availabilityFilter: string;
  currentPage: number;
  scrollY: number;
  searchQuery: string;
  selectedCategory: string;
};

const readSavedCatalogState = (): CatalogBrowseState | null => {
  if (typeof window === "undefined") return null;

  const rawState = sessionStorage.getItem(CATALOG_BROWSE_STATE_KEY);
  if (!rawState) return null;

  try {
    const parsedState = JSON.parse(rawState) as Partial<CatalogBrowseState>;

    if (
      typeof parsedState.searchQuery !== "string" ||
      typeof parsedState.selectedCategory !== "string" ||
      typeof parsedState.availabilityFilter !== "string" ||
      typeof parsedState.currentPage !== "number" ||
      typeof parsedState.scrollY !== "number"
    ) {
      sessionStorage.removeItem(CATALOG_BROWSE_STATE_KEY);
      return null;
    }

    return parsedState as CatalogBrowseState;
  } catch {
    sessionStorage.removeItem(CATALOG_BROWSE_STATE_KEY);
    return null;
  }
};

const Catalog = () => {
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category");
  const initialBrowseStateRef = useRef<CatalogBrowseState | null>(readSavedCatalogState());
  const hasRestoredScrollRef = useRef(false);
  const skipInitialPageResetRef = useRef(true);
  
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState(() => initialBrowseStateRef.current?.searchQuery ?? "");
  const [selectedCategory, setSelectedCategory] = useState(
    () => categoryFromUrl || initialBrowseStateRef.current?.selectedCategory || "all"
  );
  const [availabilityFilter, setAvailabilityFilter] = useState(
    () => initialBrowseStateRef.current?.availabilityFilter ?? "all"
  );
  const [currentPage, setCurrentPage] = useState(() => initialBrowseStateRef.current?.currentPage ?? 1);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingBookIds, setPendingBookIds] = useState<Set<string>>(new Set());

  const saveBrowseState = useCallback(() => {
    sessionStorage.setItem(
      CATALOG_BROWSE_STATE_KEY,
      JSON.stringify({
        availabilityFilter,
        currentPage,
        scrollY: window.scrollY,
        searchQuery,
        selectedCategory,
      } satisfies CatalogBrowseState)
    );
  }, [availabilityFilter, currentPage, searchQuery, selectedCategory]);

  // Restore browse context when navigating back
  useEffect(() => {
    const savedState = initialBrowseStateRef.current;

    if (
      !savedState ||
      isLoading ||
      books.length === 0 ||
      hasRestoredScrollRef.current
    ) {
      return;
    }

    const restoreScroll = () => {
      window.scrollTo({ top: savedState.scrollY, behavior: "auto" });
    };

    let firstFrame = 0;
    let secondFrame = 0;
    firstFrame = requestAnimationFrame(() => {
      restoreScroll();
      secondFrame = requestAnimationFrame(restoreScroll);
    });

    const timeoutId = window.setTimeout(() => {
      restoreScroll();
      hasRestoredScrollRef.current = true;
      initialBrowseStateRef.current = null;
      sessionStorage.removeItem(CATALOG_BROWSE_STATE_KEY);
    }, 180);

    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      window.clearTimeout(timeoutId);
    };
  }, [books.length, currentPage, isLoading]);

  useEffect(() => {
    initializeData();
    const loadBooks = async () => {
      const [booksData, requestsData] = await Promise.all([getBooks(), getBookRequests()]);
      setBooks(booksData);
      setPendingBookIds(new Set(requestsData.filter(r => r.status === "pending").map(r => r.bookId)));
      setIsLoading(false);
    };
    loadBooks();
  }, []);

  useEffect(() => {
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [categoryFromUrl]);

  const filteredBooks = useMemo(() => {
    const filtered = books.filter((book) => {
      const matchesSearch =
        !searchQuery ||
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.numberCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (book.publication && book.publication.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === "all" || book.category === selectedCategory;

      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && !book.isBorrowed) ||
        (availabilityFilter === "borrowed" && book.isBorrowed);

      return matchesSearch && matchesCategory && matchesAvailability;
    });

    return filtered.sort((a, b) => {
      // Push EN-coded books to the end
      const aIsEN = a.numberCode.toUpperCase().startsWith("EN") ? 1 : 0;
      const bIsEN = b.numberCode.toUpperCase().startsWith("EN") ? 1 : 0;
      if (aIsEN !== bIsEN) return aIsEN - bIsEN;
      if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
      const aCover = a.coverImage ? 1 : 0;
      const bCover = b.coverImage ? 1 : 0;
      if (bCover !== aCover) return bCover - aCover;
      return a.title.localeCompare(b.title);
    });
  }, [books, searchQuery, selectedCategory, availabilityFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (skipInitialPageResetRef.current) {
      skipInitialPageResetRef.current = false;
      return;
    }

    setCurrentPage(1);
  }, [searchQuery, selectedCategory, availabilityFilter]);

  const totalPages = Math.ceil(filteredBooks.length / BOOKS_PER_PAGE);
  const paginatedBooks = useMemo(
    () => filteredBooks.slice((currentPage - 1) * BOOKS_PER_PAGE, currentPage * BOOKS_PER_PAGE),
    [filteredBooks, currentPage]
  );

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setAvailabilityFilter("all");
    setCurrentPage(1);
  };

  const getPageNumbers = useCallback(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

  const topRated = useMemo(() => books.sort((a, b) => b.averageRating - a.averageRating).slice(0, 5), [books]);
  const totalAvailable = useMemo(() => books.filter(b => !b.isBorrowed).length, [books]);

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <Header />
      <main className="relative z-10">
        {/* Hero Section - Full width dramatic */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
          <div className="container px-4 py-16 md:py-24 relative">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Left: Hero text */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex-1 max-w-xl"
              >
                <Badge className="bg-primary/15 text-primary border-primary/30 mb-6 text-sm px-4 py-1.5">
                  <Library className="h-3.5 w-3.5 mr-2" />
                  {books.length} Books Available
                </Badge>
                <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-[1.1]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  Imthiyaaz
                  <br />
                  <span className="text-gradient-teal">Library</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-8 leading-relaxed">
                  Discover your next great read. Browse our curated collection, 
                  leave reviews, and request books with ease.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link to="/categories">
                    <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-base px-6">
                      Browse Categories
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {/* Stats row */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="grid grid-cols-3 gap-4 mt-12 max-w-lg"
                >
                  <div className="text-center p-4 rounded-xl bg-card/50 border border-border">
                    <BookOpen className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-2xl font-bold text-foreground">{books.length}</p>
                    <p className="text-xs text-muted-foreground">Total Books</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-card/50 border border-border">
                    <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-2xl font-bold text-foreground">{totalAvailable}</p>
                    <p className="text-xs text-muted-foreground">Available</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-card/50 border border-border">
                    <Star className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-2xl font-bold text-foreground">
                      {topRated[0]?.averageRating.toFixed(1) || "0.0"}
                    </p>
                    <p className="text-xs text-muted-foreground">Top Rated</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Right: Promo Banner (desktop only) */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="hidden lg:flex flex-1 w-full max-w-2xl self-stretch"
              >
                <PromoBanner />
              </motion.div>
            </div>
          </div>
        </section>
        {/* Promo Banner - mobile only */}
        <section className="container px-4 pt-6 lg:hidden">
          <PromoBanner />
        </section>

        {/* Catalog Section */}
        <section className="container px-4 py-10">
          {/* Search and Filters */}
          <div className="mb-8">
            <SearchFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              availabilityFilter={availabilityFilter}
              onAvailabilityChange={setAvailabilityFilter}
              onClearFilters={clearFilters}
            />
          </div>

          {/* Results Count */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading..." : `Showing ${(currentPage - 1) * BOOKS_PER_PAGE + 1}–${Math.min(currentPage * BOOKS_PER_PAGE, filteredBooks.length)} of ${filteredBooks.length} books`}
            </p>
            <p className="text-xs text-muted-foreground hidden sm:block">Sorted by rating</p>
          </div>

          {/* Book Grid */}
          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-pulse">
                <Library className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Loading books...</p>
              </div>
            </div>
          ) : paginatedBooks.length > 0 ? (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
                {paginatedBooks.map((book, index) => (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.02 }}
                  >
                    <BookCard book={book} onOpen={saveBrowseState} hasPendingRequest={pendingBookIds.has(book.id)} />
                  </motion.div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={currentPage === 1}
                    onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {getPageNumbers().map((page, i) =>
                    page === "..." ? (
                      <span key={`e${i}`} className="px-2 text-muted-foreground">…</span>
                    ) : (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="icon"
                        onClick={() => { setCurrentPage(page as number); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      >
                        {page}
                      </Button>
                    )
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={currentPage === totalPages}
                    onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <Library className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                No books found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters to find what you're looking for.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Catalog;
