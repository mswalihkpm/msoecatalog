import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import {
  getBorrowRecords,
  getReviews,
  getBooks,
  getAdminSettings,
  getLeaderboardSnapshots,
  DEFAULT_SCORING_TABLE,
  pointsForBook,
} from "@/lib/store";
import { Book, BorrowRecord, Review, LeaderboardEntry, LeaderboardSnapshot, AdminSettings, ScoringTable, PAGE_TIER_LABELS, PageTier } from "@/lib/types";
import { computeEntries } from "@/pages/admin/LeaderboardAdmin";
import { Trophy, BookOpen, Medal, Crown, Award, HelpCircle, CalendarDays, Info, CheckCircle2, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format, startOfWeek, startOfMonth, startOfYear, isAfter, parseISO } from "date-fns";

type TimeFilter = "all" | "week" | "month" | "year" | "from";
const PAGE_TIERS: PageTier[] = ["b50", "b100", "b150", "b200", "b250", "b300", "a300"];

const Leaderboard = () => {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [snapshots, setSnapshots] = useState<LeaderboardSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LeaderboardEntry | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [classFilter, setClassFilter] = useState<string>("all");

  useEffect(() => {
    Promise.all([getBorrowRecords(), getReviews(), getBooks(), getAdminSettings(), getLeaderboardSnapshots()])
      .then(([r, rv, bk, st, sn]) => { setRecords(r); setReviews(rv); setBooks(bk); setSettings(st); setSnapshots(sn); })
      .finally(() => setLoading(false));
  }, []);

  const scoringTable: ScoringTable = settings?.scoringTable && Object.keys(settings.scoringTable).length > 0
    ? settings.scoringTable
    : DEFAULT_SCORING_TABLE;
  const reviewPts = settings?.reviewPointsDefault ?? 10;

  const bookMap = useMemo(() => new Map(books.map((b) => [b.id, b])), [books]);

  const isVisible = useMemo(() => {
    if (!settings) return true;
    if (!settings.leaderboardVisible) return false;
    const now = new Date();
    if (settings.leaderboardVisibleFrom) {
      const from = parseISO(settings.leaderboardVisibleFrom);
      if (now < from) return false;
    }
    if (settings.leaderboardVisibleUntil) {
      const until = parseISO(settings.leaderboardVisibleUntil);
      if (isAfter(now, until)) return false;
    }
    return true;
  }, [settings]);

  const filteredRecords = useMemo(() => {
    let from: Date | null = null;
    const now = new Date();
    if (timeFilter === "week") from = startOfWeek(now, { weekStartsOn: 1 });
    else if (timeFilter === "month") from = startOfMonth(now);
    else if (timeFilter === "year") from = startOfYear(now);
    else if (timeFilter === "from" && settings?.leaderboardFromDate) from = parseISO(settings.leaderboardFromDate);
    if (!from) return records;
    return records.filter((r) => {
      const d = r.borrowedDate ? new Date(r.borrowedDate) : null;
      return d && !isNaN(+d) && d >= from!;
    });
  }, [records, timeFilter, settings]);

  const allEntries = useMemo(
    () => computeEntries(filteredRecords, books, scoringTable, reviewPts),
    [filteredRecords, books, scoringTable, reviewPts],
  );

  const classOptions = useMemo(() => {
    const s = new Set<string>();
    allEntries.forEach((e) => e.className && s.add(e.className));
    return Array.from(s).sort();
  }, [allEntries]);

  const entries = useMemo(
    () => classFilter === "all" ? allEntries : allEntries.filter((e) => e.className === classFilter),
    [allEntries, classFilter],
  );

  const currentFromDate = settings?.leaderboardFromDate;

  const openReader = (entry: LeaderboardEntry) => setSelected(entry);
  const readerHistory = useMemo(() => {
    if (!selected) return { read: [], reviews: [] as Review[] };
    const readList = records.filter((r) => r.borrowerName.trim() === selected.name && r.readStatus && r.readStatus !== "not_read");
    const reviewsList = reviews.filter((rv) => rv.userName.trim().toLowerCase() === selected.name.toLowerCase());
    return { read: readList, reviews: reviewsList };
  }, [selected, records, reviews]);

  const InstructionContent = () => (
    <div className="space-y-5 text-sm">
      <section>
        <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" /> How scoring works
        </h3>
        <p className="text-muted-foreground">
          Every borrowed book is marked by the admin as <strong>Full read</strong>, <strong>Half read</strong> or <strong>Not read</strong>.
          Points depend on both the book's <strong>category</strong> and its <strong>page count</strong>.
          Half read = half of the full-read points (rounded). Not read = 0.
          When the admin marks <strong>"Review conducted"</strong>, you get an extra <strong>+{reviewPts}</strong> bonus points (awarded manually — no doubling).
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-foreground mb-2">Full-read points table</h3>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-xs">
            <thead className="bg-primary/10">
              <tr>
                <th className="text-left p-1.5">Category</th>
                {PAGE_TIERS.map((t) => (
                  <th key={t} className="p-1.5 whitespace-nowrap">{PAGE_TIER_LABELS[t]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(scoringTable).map((cat) => (
                <tr key={cat} className="border-t border-border">
                  <td className="p-1.5 font-medium">{cat}</td>
                  {PAGE_TIERS.map((t) => (
                    <td key={t} className="p-1.5 text-center font-mono">{scoringTable[cat]?.[t] ?? 0}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        The admin can update this table at any time; the instructions update automatically.
      </p>
    </div>
  );

  const renderPodium = (list: LeaderboardEntry[], onClick?: (e: LeaderboardEntry) => void) => {
    const top3 = list.slice(0, 3);
    const podium = [top3[1], top3[0], top3[2]];
    const meta = [
      { rank: 2, height: "h-28", color: "from-slate-300 to-slate-500", Icon: Medal, iconColor: "text-slate-200" },
      { rank: 1, height: "h-40", color: "from-amber-300 to-amber-600", Icon: Crown, iconColor: "text-amber-100" },
      { rank: 3, height: "h-20", color: "from-orange-300 to-orange-600", Icon: Award, iconColor: "text-orange-100" },
    ];
    return (
      <div className="flex items-end justify-center gap-3 sm:gap-6 mb-8 mt-4">
        {podium.map((reader, i) => {
          const m = meta[i];
          if (!reader) return <div key={i} className="flex flex-col items-center w-24 sm:w-32"><div className={`w-full ${m.height} rounded-t-xl bg-muted/40`} /></div>;
          const Icon = m.Icon;
          return (
            <motion.button key={reader.name}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              onClick={() => onClick?.(reader)}
              className="flex flex-col items-center w-24 sm:w-32 group">
              <Icon className={`h-7 w-7 mb-1 ${m.iconColor} drop-shadow`} />
              <p className="text-sm font-semibold text-foreground text-center line-clamp-2 leading-tight mb-1">{reader.name}</p>
              {reader.className && <p className="text-[10px] text-muted-foreground mb-1">{reader.className}</p>}
              <div className={`w-full ${m.height} rounded-t-xl bg-gradient-to-b ${m.color} flex flex-col items-center justify-center text-white shadow-lg group-hover:scale-[1.02] transition-transform`}>
                <span className="text-3xl font-black drop-shadow">{m.rank}</span>
                <span className="text-xs font-semibold opacity-95">{reader.points} pts</span>
                <span className="text-[10px] font-medium opacity-80">{reader.fullRead}f · {reader.halfRead}h</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    );
  };

  const renderList = (list: LeaderboardEntry[], onClick?: (e: LeaderboardEntry) => void) => {
    const rest = list.slice(3);
    if (rest.length === 0) return null;
    return (
      <div className="space-y-2 max-w-2xl mx-auto">
        {rest.map((reader, i) => (
          <motion.button key={reader.name}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
            onClick={() => onClick?.(reader)}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-left">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex-shrink-0">{i + 4}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate flex items-center gap-1.5">
                {reader.name}
                {reader.reviewCount > 0 && <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" aria-label="Verified by review" />}
              </p>
              {reader.className && <p className="text-xs text-muted-foreground">{reader.className}</p>}
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90"><Trophy className="h-3 w-3" />{reader.points} pts</Badge>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1"><BookOpen className="h-3 w-3" />{reader.fullRead + reader.halfRead}</span>
            </div>
          </motion.button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <Header />
      <main className="relative z-10 container px-4 py-8">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="h-7 w-7 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>Top Readers</h1>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Scoring instructions"><HelpCircle className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Leaderboard Scoring</SheetTitle>
              </SheetHeader>
              <div className="mt-5"><InstructionContent /></div>
            </SheetContent>
          </Sheet>
        </div>

        {settings?.leaderboardNotice && (
          <div className="mb-4 p-3 rounded-md border border-primary/20 bg-primary/5 text-sm text-foreground whitespace-pre-wrap">
            {settings.leaderboardNotice}
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground text-center py-12">Loading leaderboard…</p>
        ) : !isVisible ? (
          <div className="text-center py-16">
            <EyeOff className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">Leaderboard is currently hidden.</p>
            <p className="text-sm text-muted-foreground">Please check back later.</p>
          </div>
        ) : (
          <Tabs defaultValue="current">
            <TabsList className="mb-4">
              <TabsTrigger value="current">Current</TabsTrigger>
              <TabsTrigger value="past">Past ({snapshots.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {currentFromDate ? <>From <span className="text-foreground font-medium">{format(new Date(currentFromDate), "MMM d, yyyy")}</span></> : "All time"}
                </div>
                <div className="flex items-center gap-2">
                  <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Class" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All classes</SelectItem>
                      {classOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
                    <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All time</SelectItem>
                      <SelectItem value="week">This week</SelectItem>
                      <SelectItem value="month">This month</SelectItem>
                      <SelectItem value="year">This year</SelectItem>
                      {currentFromDate && <SelectItem value="from">Since start date</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {entries.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">No scored readers yet.</p>
              ) : (
                <>
                  {renderPodium(entries, openReader)}
                  {renderList(entries, openReader)}
                </>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {snapshots.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">No past leaderboards yet.</p>
              ) : (
                snapshots.map((snap) => (
                  <div key={snap.id} className="border border-border rounded-lg p-4 bg-card/50">
                    <div className="mb-3">
                      <h2 className="font-serif text-lg font-semibold">{snap.name}</h2>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {snap.fromDate ? `From ${format(new Date(snap.fromDate), "MMM d, yyyy")}` : "From —"}
                        {snap.untilDate ? ` · Until ${format(new Date(snap.untilDate), "MMM d, yyyy")}` : ""}
                      </p>
                      {snap.notice && (
                        <p className="mt-2 text-xs text-foreground whitespace-pre-wrap p-2 rounded bg-primary/5 border border-primary/20">{snap.notice}</p>
                      )}
                    </div>
                    {snap.entries.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No entries.</p>
                    ) : (
                      <>
                        {renderPodium(snap.entries)}
                        {renderList(snap.entries)}
                      </>
                    )}
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}

        <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                {selected?.name}
              </DialogTitle>
              {selected?.className && <p className="text-sm text-muted-foreground">{selected.className}</p>}
            </DialogHeader>

            {selected && (
              <div className="space-y-5 mt-2">
                <div className="flex gap-2 flex-wrap">
                  <Badge className="bg-primary text-primary-foreground">{selected.points} points</Badge>
                  <Badge variant="secondary">{selected.fullRead} full read</Badge>
                  <Badge variant="outline">{selected.halfRead} half read</Badge>
                  {selected.reviewCount > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle2 className="h-3 w-3 text-primary" />
                      {selected.reviewCount} review{selected.reviewCount > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>

                <section>
                  <h3 className="text-sm font-semibold mb-2">Books Read ({readerHistory.read.length})</h3>
                  {readerHistory.read.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No read books yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {readerHistory.read.map((b) => {
                        const bk = bookMap.get(b.bookId);
                        const pts = pointsForBook(scoringTable, bk?.category, bk?.pages);
                        const awarded = b.readStatus === "full_read" ? pts : Math.round(pts / 2);
                        return (
                          <li key={b.id} className="p-2 rounded-md bg-card border border-border">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-sm text-foreground truncate">{b.bookTitle}</p>
                              <Badge variant="outline" className="text-[10px] shrink-0">
                                {b.readStatus === "full_read" ? "Full" : "Half"}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <Badge variant="secondary" className="text-[10px]">{bk?.category || "—"}</Badge>
                              <Badge variant="secondary" className="text-[10px]">{bk?.pages || "?"} pages</Badge>
                              <Badge className="text-[10px] bg-primary text-primary-foreground">+{awarded} pts</Badge>
                              {b.reviewConducted && (
                                <Badge className="text-[10px] gap-1 bg-primary/80 text-primary-foreground">
                                  <CheckCircle2 className="h-3 w-3" /> Review +{reviewPts}
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Borrowed {format(new Date(b.borrowedDate), "MMM d, yyyy")}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>

                {readerHistory.reviews.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> Reviews written ({readerHistory.reviews.length})
                    </h3>
                    <ul className="space-y-2">
                      {readerHistory.reviews.map((rv) => (
                        <li key={rv.id} className="p-2 rounded-md bg-card border border-border text-xs">
                          <p className="text-muted-foreground line-clamp-3">{rv.comment || "—"}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(rv.createdAt), "MMM d, yyyy")}</p>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Leaderboard;
