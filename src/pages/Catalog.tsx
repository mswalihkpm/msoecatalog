import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { BookCard } from "@/components/BookCard";
import { SearchFilters } from "@/components/SearchFilters";
import { Header } from "@/components/Header";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { getBooks, initializeData } from "@/lib/store";
import { Book } from "@/lib/types";
import { Library } from "lucide-react";

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

  // Update category when URL changes
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

    // Sort by rating in descending order
    return filtered.sort((a, b) => b.averageRating - a.averageRating);
  }, [books, searchQuery, selectedCategory, availabilityFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setAvailabilityFilter("all");
  };

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <Header />
      <main className="container px-4 py-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Library className="h-4 w-4" />
            <span className="text-sm font-medium">Welcome to Imthiyaaz Library</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            Explore Our <span className="text-gradient-teal">Collection</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover thousands of books across various categories. Browse, read reviews, 
            and request your next great read.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
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
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading..." : `Showing ${filteredBooks.length} of ${books.length} books (sorted by rating)`}
          </p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredBooks.map((book, index) => (
              <div
                key={book.id}
                className="animate-fade-in"
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
              >
                <BookCard book={book} />
              </div>
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
      </main>
    </div>
  );
};

export default Catalog;
