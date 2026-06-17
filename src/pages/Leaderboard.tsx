import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { getBorrowRecords, getReviews, getBooks } from "@/lib/store";
import { Book, BorrowRecord, Review } from "@/lib/types";
import { Trophy, BookOpen, Medal, Crown, Award, HelpCircle, CheckCircle2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

type ReaderStat = {
  name: string;
  className?: string;
  readCount: number;
  read: BorrowRecord[];
  current: BorrowRecord[];
  reviewCount: number;
  hasReview: boolean;
  points: number;
};

// Scoring rules (per returned book by the same user)
const REVIEWED_POINTS: Record<string, number> = {
  Islamic: 10,
  General: 8,
  Biography: 7,
  History: 6,
  Science: 5,
  Language: 4,
  English: 4,
  Poem: 4,
  Novel: 3,
  Others: 3,
};
const NON_REVIEWED_POINTS: Record<string, number> = {
  Islamic: 2,
  General: 2,
  History: 2,
  Science: 2,
  Biography: 2,
  Novel: 1,
  English: 1,
  Language: 1,
  Poem: 1,
  Others: 1,
};

const pointsFor = (category: string | undefined, reviewed: boolean) => {
  const cat = category || "Others";
  if (reviewed) return REVIEWED_POINTS[cat] ?? REVIEWED_POINTS.Others;
  return NON_REVIEWED_POINTS[cat] ?? NON_REVIEWED_POINTS.Others;
};

const Leaderboard = () => {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReaderStat | null>(null);

  useEffect(() => {
    Promise.all([getBorrowRecords(), getReviews(), getBooks()])
      .then(([r, rv, bk]) => {
        setRecords(r);
        setReviews(rv);
        setBooks(bk);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo<ReaderStat[]>(() => {
    const bookMap = new Map(books.map((b) => [b.id, b]));

    // reviewSet: key = `${userNameLower}::${bookId}` -> true
    const reviewSet = new Set<string>();
    const reviewCountByUser = new Map<string, number>();
    for (const rv of reviews) {
      const u = (rv.userName || "").trim().toLowerCase();
      if (!u) continue;
      reviewSet.add(`${u}::${rv.bookId}`);
      reviewCountByUser.set(u, (reviewCountByUser.get(u) || 0) + 1);
    }

    const map = new Map<string, ReaderStat>();
    for (const r of records) {
      const key = r.borrowerName.trim();
      if (!key) continue;
      const existing = map.get(key) ?? {
        name: key,
        className: r.borrowerClass,
        readCount: 0,
        read: [],
        current: [],
        reviewCount: 0,
        hasReview: false,
        points: 0,
      };
      if (r.isReturned) {
        existing.readCount += 1;
        existing.read.push(r);
        const book = bookMap.get(r.bookId);
        const reviewed = reviewSet.has(`${key.toLowerCase()}::${r.bookId}`);
        existing.points += pointsFor(book?.category, reviewed);
      } else {
        existing.current.push(r);
      }
      if (!existing.className && r.borrowerClass) existing.className = r.borrowerClass;
      map.set(key, existing);
    }

    for (const stat of map.values()) {
      const rc = reviewCountByUser.get(stat.name.toLowerCase()) || 0;
      stat.reviewCount = rc;
      stat.hasReview = rc > 0;
    }

    return Array.from(map.values())
      .filter((s) => s.readCount > 0 || s.current.length > 0)
      .sort(
        (a, b) =>
          b.points - a.points ||
          b.reviewCount - a.reviewCount ||
          b.readCount - a.readCount ||
          a.name.localeCompare(b.name),
      );
  }, [records, reviews, books]);

  const top3 = stats.slice(0, 3);
  const rest = stats.slice(3);

  const podium = [top3[1], top3[0], top3[2]];
  const podiumMeta = [
    { rank: 2, height: "h-28", color: "from-slate-300 to-slate-500", Icon: Medal, iconColor: "text-slate-200" },
    { rank: 1, height: "h-40", color: "from-amber-300 to-amber-600", Icon: Crown, iconColor: "text-amber-100" },
    { rank: 3, height: "h-20", color: "from-orange-300 to-orange-600", Icon: Award, iconColor: "text-orange-100" },
  ];

  const InstructionContent = () => (
    <div className="space-y-5 text-sm">
      <section>
        <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> How ranking works
        </h3>
        <p className="text-muted-foreground">
          Every reader earns points each time they <strong>request → borrow → return</strong> a book.
          Writing a <strong>review</strong> after returning multiplies the reward, because a review is
          proof of real reading.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-foreground mb-2">Points when you write a review</h3>
        <ul className="space-y-1 text-muted-foreground">
          <li className="flex justify-between border-b border-border/50 pb-1"><span>Islamic</span><span className="font-mono text-foreground">10</span></li>
          <li className="flex justify-between border-b border-border/50 pb-1"><span>General</span><span className="font-mono text-foreground">8</span></li>
          <li className="flex justify-between border-b border-border/50 pb-1"><span>Biography</span><span className="font-mono text-foreground">7</span></li>
          <li className="flex justify-between border-b border-border/50 pb-1"><span>History</span><span className="font-mono text-foreground">6</span></li>
          <li className="flex justify-between border-b border-border/50 pb-1"><span>Science</span><span className="font-mono text-foreground">5</span></li>
          <li className="flex justify-between border-b border-border/50 pb-1"><span>Language / English / Poem</span><span className="font-mono text-foreground">4</span></li>
          <li className="flex justify-between"><span>Novel / Others</span><span className="font-mono text-foreground">3</span></li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-foreground mb-2">Points without a review</h3>
        <ul className="space-y-1 text-muted-foreground">
          <li className="flex justify-between border-b border-border/50 pb-1"><span>Islamic / General / History / Science / Biography</span><span className="font-mono text-foreground">2</span></li>
          <li className="flex justify-between"><span>Novel / English / Language / Poem / Others</span><span className="font-mono text-foreground">1</span></li>
        </ul>
      </section>

      <section className="rounded-md border border-primary/30 bg-primary/5 p-3 text-muted-foreground">
        <p className="font-semibold text-foreground mb-1">Notes</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Only <strong>returned</strong> books earn points. Currently-borrowed books do not count yet.</li>
          <li>A review counts only when the same reader reviewed the same book they returned.</li>
          <li>Ties break by total reviews, then by total books read.</li>
          <li>Tap any reader to see their reading history.</li>
        </ul>
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <Header />
      <main className="relative z-10 container px-4 py-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Trophy className="h-7 w-7 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Top Readers
            </h1>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Scoring instructions">
                <HelpCircle className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Leaderboard Scoring
                </SheetTitle>
              </SheetHeader>
              <div className="mt-5">
                <InstructionContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-12">Loading leaderboard…</p>
        ) : stats.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No reading records yet.</p>
        ) : (
          <>
            {/* Podium */}
            <div className="flex items-end justify-center gap-3 sm:gap-6 mb-10 mt-4">
              {podium.map((reader, i) => {
                const meta = podiumMeta[i];
                if (!reader) {
                  return (
                    <div key={i} className="flex flex-col items-center w-24 sm:w-32">
                      <div className={`w-full ${meta.height} rounded-t-xl bg-muted/40`} />
                    </div>
                  );
                }
                const { Icon } = meta;
                return (
                  <motion.button
                    key={reader.name}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setSelected(reader)}
                    className="flex flex-col items-center w-24 sm:w-32 group"
                  >
                    <Icon className={`h-7 w-7 mb-1 ${meta.iconColor} drop-shadow`} />
                    <p className="text-sm font-semibold text-foreground text-center line-clamp-2 leading-tight mb-1">
                      {reader.name}
                    </p>
                    {reader.className && (
                      <p className="text-[10px] text-muted-foreground mb-1">{reader.className}</p>
                    )}
                    <div
                      className={`w-full ${meta.height} rounded-t-xl bg-gradient-to-b ${meta.color} flex flex-col items-center justify-center text-white shadow-lg group-hover:scale-[1.02] transition-transform`}
                    >
                      <span className="text-3xl font-black drop-shadow">{meta.rank}</span>
                      <span className="text-xs font-semibold opacity-95">{reader.points} pts</span>
                      <span className="text-[10px] font-medium opacity-80">{reader.readCount} books</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* List */}
            {rest.length > 0 && (
              <div className="space-y-2 max-w-2xl mx-auto">
                {rest.map((reader, i) => (
                  <motion.button
                    key={reader.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelected(reader)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex-shrink-0">
                      {i + 4}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate flex items-center gap-1.5">
                        {reader.name}
                        {reader.hasReview && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" aria-label="Verified by review" />
                        )}
                      </p>
                      {reader.className && (
                        <p className="text-xs text-muted-foreground">{reader.className}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90">
                        <Trophy className="h-3 w-3" />
                        {reader.points} pts
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {reader.readCount}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </>
        )}

        <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                {selected?.name}
              </DialogTitle>
              {selected?.className && (
                <p className="text-sm text-muted-foreground">{selected.className}</p>
              )}
            </DialogHeader>

            {selected && (
              <div className="space-y-5 mt-2">
                <div className="flex gap-2 flex-wrap">
                  <Badge className="bg-primary text-primary-foreground">{selected.points} points</Badge>
                  <Badge variant="secondary">{selected.readCount} read</Badge>
                  {selected.hasReview && (
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle2 className="h-3 w-3 text-primary" />
                      {selected.reviewCount} review{selected.reviewCount > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>

                {selected.current.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold mb-2 text-primary">
                      Currently Reading ({selected.current.length})
                    </h3>
                    <ul className="space-y-2">
                      {selected.current.map((b) => (
                        <li key={b.id} className="p-2 rounded-md bg-primary/5 border border-primary/20">
                          <p className="font-medium text-sm text-foreground">{b.bookTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            Borrowed {format(new Date(b.borrowedDate), "MMM d, yyyy")}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <section>
                  <h3 className="text-sm font-semibold mb-2">
                    Books Read ({selected.readCount})
                  </h3>
                  {selected.read.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No completed books yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {selected.read.map((b) => (
                        <li key={b.id} className="p-2 rounded-md bg-card border border-border">
                          <p className="font-medium text-sm text-foreground">{b.bookTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            Returned {format(new Date(b.returnDate), "MMM d, yyyy")}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Leaderboard;
