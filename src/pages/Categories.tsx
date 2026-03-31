import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getBooks, initializeData } from "@/lib/store";
import { Book, Category } from "@/lib/types";
import { 
  BookOpen, 
  Scroll, 
  User, 
  FlaskConical, 
  Languages, 
  BookText, 
  History, 
  Layers, 
  Feather, 
  MoreHorizontal,
  ArrowLeft,
  Star,
} from "lucide-react";

const categoryIcons: Record<Category, React.ReactNode> = {
  Islamic: <Scroll className="h-8 w-8" />,
  Novel: <BookOpen className="h-8 w-8" />,
  Biography: <User className="h-8 w-8" />,
  Science: <FlaskConical className="h-8 w-8" />,
  English: <Languages className="h-8 w-8" />,
  Language: <BookText className="h-8 w-8" />,
  History: <History className="h-8 w-8" />,
  General: <Layers className="h-8 w-8" />,
  Poem: <Feather className="h-8 w-8" />,
  Others: <MoreHorizontal className="h-8 w-8" />,
};

const allCategories: Category[] = [
  "Islamic", "Novel", "Biography", "Science", "English",
  "Language", "History", "General", "Poem", "Others",
];

const Categories = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    initializeData();
    const loadBooks = async () => {
      const booksData = await getBooks();
      setBooks(booksData);
      setIsLoading(false);
    };
    loadBooks();
  }, []);

  const getCategoryCount = (category: Category) =>
    books.filter((book) => book.category === category).length;

  const getAvailableCount = (category: Category) =>
    books.filter((book) => book.category === category && !book.isBorrowed).length;

  const filteredBooks = selectedCategory
    ? books.filter((b) => b.category === selectedCategory)
    : [];

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <Header />
      <main className="container px-4 py-8 relative z-10">
        {!selectedCategory ? (
          <>
            <div className="text-center mb-12 animate-fade-in">
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
                Browse by <span className="text-gradient-teal">Category</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Explore our collection organized by categories. Find the perfect book for your interests.
              </p>
            </div>

            {isLoading ? (
              <div className="text-center py-16">
                <div className="animate-pulse">
                  <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading categories...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {allCategories.map((category, index) => {
                  const totalBooks = getCategoryCount(category);
                  const availableBooks = getAvailableCount(category);

                  return (
                    <div
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className="animate-fade-in cursor-pointer"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <Card className="h-full transition-all duration-300 hover:shadow-teal hover:border-primary/50 hover:scale-[1.02]">
                        <CardHeader className="text-center pb-2">
                          <div className="mx-auto mb-3 p-4 rounded-full bg-primary/10 text-primary">
                            {categoryIcons[category]}
                          </div>
                          <CardTitle className="font-serif text-xl">{category}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center space-y-2">
                          <p className="text-2xl font-bold text-foreground">{totalBooks}</p>
                          <p className="text-sm text-muted-foreground">Total Books</p>
                          <Badge variant="secondary" className="mt-2">
                            {availableBooks} Available
                          </Badge>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedCategory(null)}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  {categoryIcons[selectedCategory]}
                </div>
                <div>
                  <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
                    {selectedCategory}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {filteredBooks.length} books found
                  </p>
                </div>
              </div>
            </div>

            {filteredBooks.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No books in this category yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredBooks.map((book) => (
                  <Link
                    key={book.id}
                    to={`/book/${book.id}`}
                    className="block"
                  >
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card hover:border-primary/50 hover:shadow-teal transition-all duration-200">
                      {/* Cover thumbnail */}
                      <div className="shrink-0 w-12 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                        {book.coverImage ? (
                          <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="h-5 w-5 text-muted-foreground/50" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{book.title}</p>
                        <p className="text-sm text-muted-foreground truncate">by {book.author}</p>
                      </div>

                      {/* Rating & status */}
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        {book.averageRating > 0 && (
                          <span className="flex items-center gap-1 text-sm text-foreground">
                            <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                            {book.averageRating.toFixed(1)}
                          </span>
                        )}
                        <Badge variant={book.isBorrowed ? "destructive" : "secondary"} className="text-[10px]">
                          {book.isBorrowed ? "Borrowed" : "Available"}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Categories;
