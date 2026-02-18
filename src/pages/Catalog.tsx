import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { BookCard } from "@/components/BookCard";
import { SearchFilters } from "@/components/SearchFilters";
import { Header } from "@/components/Header";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { getBooks, initializeData } from "@/lib/store";
import { Book } from "@/lib/types";
import { Library, BookOpen, TrendingUp, Star, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const Catalog = () => {
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category");
  
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl || "all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeData();
    const loadBooks = async () => {
      const booksData = await getBooks();
      setBooks(booksData);
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
        book.numberCode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || book.category === selectedCategory;

      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && !book.isBorrowed) ||
        (availabilityFilter === "borrowed" && book.isBorrowed);

      return matchesSearch && matchesCategory && matchesAvailability;
    });

    return filtered.sort((a, b) => b.averageRating - a.averageRating);
  }, [books, searchQuery, selectedCategory, availabilityFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setAvailabilityFilter("all");
  };

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
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <Badge className="bg-primary/15 text-primary border-primary/30 mb-6 text-sm px-4 py-1.5">
                <Library className="h-3.5 w-3.5 mr-2" />
                {books.length} Books Available
              </Badge>
              <h1 className="font-serif text-5xl md:text-7xl font-bold text-foreground mb-6 leading-[1.1]">
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
            </motion.div>

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
          </div>
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
              {isLoading ? "Loading..." : `Showing ${filteredBooks.length} of ${books.length} books`}
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
          ) : filteredBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredBooks.map((book, index) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                >
                  <BookCard book={book} />
                </motion.div>
              ))}
            </div>
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
