import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getBooks, initializeData, getPublicationLogos, PublicationLogo } from "@/lib/store";
import { Book, Category } from "@/lib/types";
import {
  BookOpen, Scroll, User, FlaskConical, Languages, BookText,
  History, Layers, Feather, MoreHorizontal, ArrowLeft, Star, Building2,
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

const STATE_KEY = "categoriesBrowseState";

type SavedState = {
  view: "categories" | "category" | "publications" | "publication";
  selectedCategory: Category | null;
  selectedPublication: string | null;
  scrollY: number;
};

const readSaved = (): SavedState | null => {
  try {
    const raw = sessionStorage.getItem(STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedState;
  } catch {
    return null;
  }
};

const Categories = () => {
  const initialRef = useRef<SavedState | null>(readSaved());
  const restoredRef = useRef(false);

  const [books, setBooks] = useState<Book[]>([]);
  const [pubLogos, setPubLogos] = useState<PublicationLogo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<SavedState["view"]>(initialRef.current?.view ?? "categories");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(initialRef.current?.selectedCategory ?? null);
  const [selectedPublication, setSelectedPublication] = useState<string | null>(initialRef.current?.selectedPublication ?? null);

  useEffect(() => {
    initializeData();
    (async () => {
      const [b, p] = await Promise.all([getBooks(), getPublicationLogos()]);
      setBooks(b);
      setPubLogos(p);
      setIsLoading(false);
    })();
  }, []);

  // Restore scroll
  useEffect(() => {
    const saved = initialRef.current;
    if (!saved || isLoading || books.length === 0 || restoredRef.current) return;
    const restore = () => window.scrollTo({ top: saved.scrollY, behavior: "auto" });
    const f1 = requestAnimationFrame(() => {
      restore();
      requestAnimationFrame(restore);
    });
    const t = window.setTimeout(() => {
      restore();
      restoredRef.current = true;
      initialRef.current = null;
      sessionStorage.removeItem(STATE_KEY);
    }, 180);
    return () => { cancelAnimationFrame(f1); clearTimeout(t); };
  }, [books.length, isLoading]);

  const saveState = useCallback(() => {
    sessionStorage.setItem(STATE_KEY, JSON.stringify({
      view, selectedCategory, selectedPublication, scrollY: window.scrollY,
    } satisfies SavedState));
  }, [view, selectedCategory, selectedPublication]);

  const getCategoryCount = (c: Category) => books.filter((b) => b.category === c).length;
  const getAvailableCount = (c: Category) => books.filter((b) => b.category === c && !b.isBorrowed).length;

  const publicationsList = (() => {
    const map = new Map<string, number>();
    books.forEach((b) => {
      const pub = (b.publication || "").trim();
      if (!pub) return;
      map.set(pub, (map.get(pub) || 0) + 1);
    });
    const logoByName = new Map(pubLogos.map((p) => [p.publicationName.toLowerCase(), p.logoUrl]));
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count, logo: logoByName.get(name.toLowerCase()) }));
  })();

  const filteredBooks =
    view === "category" && selectedCategory
      ? books.filter((b) => b.category === selectedCategory)
      : view === "publication" && selectedPublication
      ? books.filter((b) => (b.publication || "").trim().toLowerCase() === selectedPublication.toLowerCase())
      : [];

  const goBack = () => {
    if (view === "category") setView("categories");
    else if (view === "publication") setView("publications");
    else if (view === "publications") setView("categories");
    setSelectedCategory(null);
    setSelectedPublication(null);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <Header />
      <main className="container px-4 py-8 relative z-10">
        {view === "categories" && (
          <>
            <div className="mb-4 animate-fade-in">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Link>
              </Button>
            </div>
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
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {allCategories.map((category, index) => {
                    const totalBooks = getCategoryCount(category);
                    const availableBooks = getAvailableCount(category);
                    return (
                      <div
                        key={category}
                        onClick={() => { setSelectedCategory(category); setView("category"); window.scrollTo({ top: 0 }); }}
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
                  {/* Publications card */}
                  <div
                    onClick={() => { setView("publications"); window.scrollTo({ top: 0 }); }}
                    className="animate-fade-in cursor-pointer"
                  >
                    <Card className="h-full transition-all duration-300 hover:shadow-teal hover:border-primary/50 hover:scale-[1.02] border-primary/30">
                      <CardHeader className="text-center pb-2">
                        <div className="mx-auto mb-3 p-4 rounded-full bg-primary/10 text-primary">
                          <Building2 className="h-8 w-8" />
                        </div>
                        <CardTitle className="font-serif text-xl">Publications</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center space-y-2">
                        <p className="text-2xl font-bold text-foreground">{publicationsList.length}</p>
                        <p className="text-sm text-muted-foreground">Publication Houses</p>
                        <Badge variant="secondary" className="mt-2">Browse by publisher</Badge>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {view === "publications" && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">Publication Houses</h1>
                <p className="text-sm text-muted-foreground">{publicationsList.length} publishers found</p>
              </div>
            </div>
            {publicationsList.length === 0 ? (
              <div className="text-center py-16">
                <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No publication info found in books yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {publicationsList.map((p) => (
                  <div
                    key={p.name}
                    onClick={() => { setSelectedPublication(p.name); setView("publication"); window.scrollTo({ top: 0 }); }}
                    className="cursor-pointer"
                  >
                    <Card className="h-full transition-all duration-300 hover:shadow-teal hover:border-primary/50 hover:scale-[1.02]">
                      <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                        <div className="h-20 w-20 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                          {p.logo ? (
                            <img src={p.logo} alt={p.name} className="h-full w-full object-cover" />
                          ) : (
                            <Building2 className="h-8 w-8 text-primary" />
                          )}
                        </div>
                        <p className="font-semibold text-foreground text-sm line-clamp-2">{p.name}</p>
                        <Badge variant="secondary" className="text-[10px]">{p.count} books</Badge>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(view === "category" || view === "publication") && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  {view === "category" && selectedCategory ? categoryIcons[selectedCategory] : <Building2 className="h-8 w-8" />}
                </div>
                <div>
                  <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
                    {view === "category" ? selectedCategory : selectedPublication}
                  </h1>
                  <p className="text-sm text-muted-foreground">{filteredBooks.length} books found</p>
                </div>
              </div>
            </div>

            {filteredBooks.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No books here yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredBooks.map((book) => (
                  <Link key={book.id} to={`/book/${book.id}`} className="block" onClick={saveState}>
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card hover:border-primary/50 hover:shadow-teal transition-all duration-200">
                      <div className="shrink-0 w-12 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                        {book.coverImage ? (
                          <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="h-5 w-5 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{book.title}</p>
                        <p className="text-sm text-muted-foreground truncate">by {book.author}</p>
                        <p className="text-xs text-primary font-mono mt-0.5">{book.numberCode}</p>
                      </div>
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
