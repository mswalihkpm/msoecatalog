import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  MoreHorizontal 
} from "lucide-react";

const categoryIcons: Record<Category, React.ReactNode> = {
  Islamic: <Scroll className="h-8 w-8" />,
  Novel: <BookOpen className="h-8 w-8" />,
  Biography: <User className="h-8 w-8" />,
  Science: <FlaskConical className="h-8 w-8" />,
  English: <Languages className="h-8 w-8" />,
  Arabic: <BookText className="h-8 w-8" />,
  History: <History className="h-8 w-8" />,
  General: <Layers className="h-8 w-8" />,
  Poem: <Feather className="h-8 w-8" />,
  Others: <MoreHorizontal className="h-8 w-8" />,
};

const allCategories: Category[] = [
  "Islamic",
  "Novel",
  "Biography",
  "Science",
  "English",
  "Arabic",
  "History",
  "General",
  "Poem",
  "Others",
];

const Categories = () => {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    initializeData();
    setBooks(getBooks());
  }, []);

  const getCategoryCount = (category: Category) => {
    return books.filter((book) => book.category === category).length;
  };

  const getAvailableCount = (category: Category) => {
    return books.filter((book) => book.category === category && !book.isBorrowed).length;
  };

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <Header />
      <main className="container px-4 py-8 relative z-10">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            Browse by <span className="text-gradient-gold">Category</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our collection organized by categories. Find the perfect book for your interests.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {allCategories.map((category, index) => {
            const totalBooks = getCategoryCount(category);
            const availableBooks = getAvailableCount(category);

            return (
              <Link
                key={category}
                to={`/?category=${category}`}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <Card className="h-full transition-all duration-300 hover:shadow-gold hover:border-primary/50 hover:scale-[1.02] cursor-pointer">
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
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Categories;
