import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { getBorrowRecords, getReviews } from "@/lib/store";
import { BorrowRecord, Review } from "@/lib/types";
import { Trophy, BookOpen, Medal, Crown, Award, Info, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

type ReaderStat = {
  name: string;
  className?: string;
  readCount: number;
  read: BorrowRecord[];
  current: BorrowRecord[];
  reviewCount: number;
  hasReview: boolean;
};

const Leaderboard = () => {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReaderStat | null>(null);

  useEffect(() => {
    Promise.all([getBorrowRecords(), getReviews()])
      .then(([r, rv]) => {
        setRecords(r);
        setReviews(rv);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo<ReaderStat[]>(() => {
    // Count reviews per normalized user name
    const reviewMap = new Map<string, number>();
    for (const rv of reviews) {
      const key = (rv.userName || "").trim().toLowerCase();
      if (!key) continue;
      reviewMap.set(key, (reviewMap.get(key) || 0) + 1);
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
      };
      if (r.isReturned) {
        existing.readCount += 1;
        existing.read.push(r);
      } else {
        existing.current.push(r);
      }
      if (!existing.className && r.borrowerClass) existing.className = r.borrowerClass;
      map.set(key, existing);
    }

    // Attach review counts
    for (const stat of map.values()) {
      const rc = reviewMap.get(stat.name.toLowerCase()) || 0;
      stat.reviewCount = rc;
      stat.hasReview = rc > 0;
    }

    return Array.from(map.values())
      .filter((s) => s.readCount > 0 || s.current.length > 0)
      .sort(
        (a, b) =>
          // Reviewers come first (proof of reading)
          Number(b.hasReview) - Number(a.hasReview) ||
          b.reviewCount - a.reviewCount ||
          b.readCount - a.readCount ||
          a.name.localeCompare(b.name),
      );
  }, [records, reviews]);

  const top3 = stats.slice(0, 3);
  const rest = stats.slice(3);

  // Podium order: 2, 1, 3
  const podium = [top3[1], top3[0], top3[2]];
  const podiumMeta = [
    { rank: 2, height: "h-28", color: "from-slate-300 to-slate-500", Icon: Medal, iconColor: "text-slate-200" },
    { rank: 1, height: "h-40", color: "from-amber-300 to-amber-600", Icon: Crown, iconColor: "text-amber-100" },
    { rank: 3, height: "h-20", color: "from-orange-300 to-orange-600", Icon: Award, iconColor: "text-orange-100" },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <Header />
      <main className="relative z-10 container px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="h-7 w-7 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Top Readers
          </h1>
        </div>

        <div className="mb-6 p-4 rounded-lg border border-primary/30 bg-primary/5 flex gap-3">
          <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-foreground/90 space-y-1">
            <p className="font-semibold">How the leaderboard works</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Readers who wrote a review for a book are ranked first — a review is proof of actual reading.</li>
              <li>Among reviewers, those with more reviews and more returned books rank higher.</li>
              <li>Only returned books count toward the read count; currently-borrowed books are shown separately.</li>
              <li>Tap any reader to see their full reading history and current book.</li>
            </ul>
          </div>
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
                      <span className="text-xs font-medium opacity-90">{reader.readCount} books</span>
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
                      <p className="font-semibold text-foreground truncate">{reader.name}</p>
                      {reader.className && (
                        <p className="text-xs text-muted-foreground">{reader.className}</p>
                      )}
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <BookOpen className="h-3 w-3" />
                      {reader.readCount}
                    </Badge>
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
