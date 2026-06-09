import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Check, X, ChevronRight, BookOpen, User, Calendar, ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format } from "date-fns";
import {
  getBookRequests,
  getBooks,
  getReviews,
  updateBookRequest,
} from "@/lib/store";
import { Book, BookRequest, Review } from "@/lib/types";
import { GeneratedCover } from "@/components/GeneratedCover";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [openBookId, setOpenBookId] = useState<string | null>(null);
  const [openBookReviews, setOpenBookReviews] = useState<Review[]>([]);
  const [openBookHistory, setOpenBookHistory] = useState<BookRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionStorage.getItem("isManagerLoggedIn")) {
      navigate("/manager");
      return;
    }
    load();
  }, [navigate]);

  const load = async () => {
    setLoading(true);
    const [reqs, bks] = await Promise.all([getBookRequests(), getBooks()]);
    setRequests(reqs);
    setBooks(bks);
    setLoading(false);
  };

  const bookById = useMemo(() => {
    const m = new Map<string, Book>();
    books.forEach((b) => m.set(b.id, b));
    return m;
  }, [books]);

  // Manager view: novel requests waiting for manager
  const managerPending = useMemo(
    () => requests.filter((r) => r.status === "manager_pending"),
    [requests]
  );

  // Group by category (from books table)
  const grouped = useMemo(() => {
    const g: Record<string, BookRequest[]> = {};
    managerPending.forEach((r) => {
      const cat = bookById.get(r.bookId)?.category || "Other";
      if (!g[cat]) g[cat] = [];
      g[cat].push(r);
    });
    Object.values(g).forEach((arr) =>
      arr.sort((a, b) => new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime())
    );
    return g;
  }, [managerPending, bookById]);

  const handleApprove = async (r: BookRequest) => {
    // Move to admin's borrow queue: status becomes "pending"
    await updateBookRequest(r.id, { status: "pending" });
    toast.success(`Approved. Sent to admin's borrow queue.`);
    await load();
  };

  const handleReject = async (r: BookRequest) => {
    await updateBookRequest(r.id, { status: "manager_rejected" });
    toast.success("Request rejected");
    await load();
  };

  const openBook = async (bookId: string) => {
    setOpenBookId(bookId);
    const reviews = await getReviews(bookId);
    setOpenBookReviews(reviews.filter((r) => r.comment && r.comment.trim()));
    // Previous requesters for this same book (any status)
    const { data } = await supabase
      .from("book_requests")
      .select("*")
      .eq("book_id", bookId)
      .order("request_date", { ascending: false });
    setOpenBookHistory(
      (data || []).map((d: any) => ({
        id: d.id,
        bookId: d.book_id,
        bookTitle: d.book_title,
        bookNumberCode: d.book_number_code,
        bookVolume: d.book_volume || undefined,
        requesterName: d.requester_name,
        requesterClass: d.requester_class,
        requestDate: d.request_date,
        returnDate: d.return_date || undefined,
        status: d.status,
      }))
    );
  };

  const handleLogout = () => {
    sessionStorage.removeItem("isManagerLoggedIn");
    navigate("/manager");
  };

  // ===== Book detail modal-like view =====
  if (openBookId) {
    const book = bookById.get(openBookId);
    if (!book) {
      setOpenBookId(null);
      return null;
    }
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-30 bg-card border-b border-border">
          <div className="flex items-center gap-3 p-3">
            <Button size="icon" variant="ghost" onClick={() => setOpenBookId(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-serif text-lg font-semibold truncate">Book Details</h1>
          </div>
        </header>
        <main className="p-4 space-y-4 max-w-md mx-auto">
          <div className="rounded-xl overflow-hidden border-2 border-primary/20 mx-auto w-48">
            {book.coverImage ? (
              <img src={book.coverImage} alt={book.title} className="w-full h-auto" />
            ) : (
              <GeneratedCover
                title={book.title}
                author={book.author}
                publication={book.publication}
                className="w-full h-auto aspect-[3/4]"
              />
            )}
          </div>
          <div className="text-center">
            <Badge className="bg-primary text-primary-foreground mb-2">{book.category}</Badge>
            <h2 className="font-serif text-2xl font-bold">{book.title}</h2>
            <p className="text-muted-foreground">by {book.author}</p>
          </div>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">Description</h3>
              <p className="text-sm leading-relaxed">
                {book.description || "No description available."}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2 text-sm uppercase text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" /> Previous Requesters ({openBookHistory.length})
              </h3>
              {openBookHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No previous requests</p>
              ) : (
                <ul className="space-y-2">
                  {openBookHistory.map((h) => (
                    <li key={h.id} className="flex items-center justify-between text-sm border-b border-border last:border-0 pb-2 last:pb-0">
                      <div>
                        <p className="font-medium">{h.requesterName}</p>
                        <p className="text-xs text-muted-foreground">
                          {h.requesterClass} · {format(new Date(h.requestDate), "MMM d, yyyy")}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {h.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2 text-sm uppercase text-muted-foreground flex items-center gap-2">
                <Star className="h-4 w-4" /> Reviews ({openBookReviews.length})
              </h3>
              {openBookReviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews yet</p>
              ) : (
                <ul className="space-y-3">
                  {openBookReviews.map((r) => (
                    <li key={r.id} className="border-b border-border last:border-0 pb-2 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">{r.userName}</p>
                        <div className="flex items-center gap-1 text-xs text-primary">
                          <Star className="h-3 w-3 fill-current" /> {r.rating}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{r.comment}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // ===== Main dashboard =====
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card border-b border-border">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="h-8 w-8 object-contain" />
            <div>
              <h1 className="font-serif text-base font-semibold leading-tight">Manager</h1>
              <p className="text-[10px] text-muted-foreground leading-tight">Novel Approvals</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={handleLogout} className="gap-1">
            <LogOut className="h-4 w-4" /> Exit
          </Button>
        </div>
      </header>

      <main className="p-3 max-w-md mx-auto space-y-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Pending approvals</p>
              <p className="text-2xl font-bold text-primary">{managerPending.length}</p>
            </div>
            <BookOpen className="h-8 w-8 text-primary/40" />
          </CardContent>
        </Card>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading…</p>
        ) : managerPending.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Check className="h-10 w-10 text-primary mx-auto mb-2" />
              <p className="font-medium">All caught up!</p>
              <p className="text-sm text-muted-foreground">No requests waiting for approval.</p>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" defaultValue={Object.keys(grouped)} className="space-y-2">
            {Object.entries(grouped).map(([cat, items]) => (
              <AccordionItem key={cat} value={cat} className="border rounded-xl bg-card px-3">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-semibold">{cat}</span>
                    <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-3">
                  {items.map((r) => (
                    <Card key={r.id} className="bg-muted/30">
                      <CardContent className="p-3 space-y-2">
                        <button
                          onClick={() => openBook(r.bookId)}
                          className="text-left w-full group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-sm group-hover:text-primary transition-colors">
                              {r.bookTitle}
                              {r.bookVolume ? ` (Vol. ${r.bookVolume})` : ""}
                            </p>
                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Code: {r.bookNumberCode}
                          </p>
                        </button>
                        <div className="text-xs space-y-0.5 border-t border-border pt-2">
                          <p className="flex items-center gap-1.5">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{r.requesterName}</span>
                            <span className="text-muted-foreground">· {r.requesterClass}</span>
                          </p>
                          <p className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(r.requestDate), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive/40 text-destructive hover:bg-destructive/10"
                            onClick={() => handleReject(r)}
                          >
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                          <Button
                            size="sm"
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => handleApprove(r)}
                          >
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </main>
    </div>
  );
};

export default ManagerDashboard;
