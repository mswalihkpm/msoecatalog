import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Trophy, Save, Trash2, Eye, EyeOff, CalendarDays, RefreshCw, MessageSquare, CheckCircle2, Info } from "lucide-react";
import {
  getBorrowRecords,
  updateBorrowRecord,
  getAdminSettings,
  updateLeaderboardSettings,
  getLeaderboardSnapshots,
  addLeaderboardSnapshot,
  deleteLeaderboardSnapshot,
  getBooks,
} from "@/lib/store";
import { BorrowRecord, Book, LeaderboardEntry, LeaderboardSnapshot, ReadStatus, AdminSettings as AdminSettingsT } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Scoring
const FULL_POINTS: Record<string, number> = {
  Islamic: 10,
  Science: 8, History: 8, General: 8, Biography: 8,
  Travelogue: 7, English: 7, Language: 7, Arabic: 7,
  Story: 4, Novel: 4, "English Novel": 4, Poem: 4,
};
const HALF_POINTS: Record<string, number> = {
  Islamic: 4,
  Science: 3, History: 3, General: 3, Biography: 3,
  Travelogue: 2, English: 2, Language: 2, Arabic: 2,
  Story: 1, Novel: 1, "English Novel": 1, Poem: 1,
};
const fullPointsFor = (cat?: string) => (cat && FULL_POINTS[cat] != null ? FULL_POINTS[cat] : 3);
const halfPointsFor = (cat?: string) => (cat && HALF_POINTS[cat] != null ? HALF_POINTS[cat] : 1);

export function computeEntries(records: BorrowRecord[], books: Book[]): LeaderboardEntry[] {
  const bookMap = new Map(books.map((b) => [b.id, b]));
  const map = new Map<string, LeaderboardEntry>();
  for (const r of records) {
    const key = r.borrowerName.trim();
    if (!key) continue;
    const entry = map.get(key) ?? {
      name: key,
      className: r.borrowerClass,
      points: 0,
      fullRead: 0,
      halfRead: 0,
      reviewCount: 0,
    };
    if (!entry.className && r.borrowerClass) entry.className = r.borrowerClass;
    const book = bookMap.get(r.bookId);
    const cat = book?.category;
    if (r.readStatus === "full_read") {
      entry.fullRead += 1;
      let p = fullPointsFor(cat);
      if (r.reviewConducted) {
        p = p * 2;
        entry.reviewCount += 1;
      }
      entry.points += p;
    } else if (r.readStatus === "half_read") {
      entry.halfRead += 1;
      entry.points += halfPointsFor(cat);
    }
    map.set(key, entry);
  }
  return Array.from(map.values())
    .filter((e) => e.points > 0 || e.fullRead > 0 || e.halfRead > 0)
    .sort((a, b) => b.points - a.points || b.fullRead - a.fullRead || a.name.localeCompare(b.name));
}

const LeaderboardAdmin = () => {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [settings, setSettings] = useState<AdminSettingsT | null>(null);
  const [snapshots, setSnapshots] = useState<LeaderboardSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [snapName, setSnapName] = useState("");

  const load = async () => {
    setLoading(true);
    const [rs, bs, st, sn] = await Promise.all([
      getBorrowRecords(), getBooks(), getAdminSettings(), getLeaderboardSnapshots(),
    ]);
    setRecords(rs);
    setBooks(bs);
    setSettings(st);
    setSnapshots(sn);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const bookMap = useMemo(() => new Map(books.map((b) => [b.id, b])), [books]);
  const categories = useMemo(() => {
    const s = new Set<string>();
    books.forEach((b) => b.category && s.add(b.category));
    return Array.from(s).sort();
  }, [books]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const b = bookMap.get(r.bookId);
      if (search) {
        const q = search.toLowerCase();
        if (!r.borrowerName.toLowerCase().includes(q) && !r.bookTitle.toLowerCase().includes(q)) return false;
      }
      if (categoryFilter !== "all" && b?.category !== categoryFilter) return false;
      if (statusFilter !== "all" && (r.readStatus || "not_read") !== statusFilter) return false;
      return true;
    });
  }, [records, bookMap, search, categoryFilter, statusFilter]);

  const entries = useMemo(() => computeEntries(records, books), [records, books]);

  const handleUpdateStatus = async (id: string, readStatus: ReadStatus) => {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, readStatus } : r)));
    await updateBorrowRecord(id, { readStatus } as any);
    toast.success("Updated");
  };

  const handleToggleReview = async (id: string, val: boolean) => {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, reviewConducted: val } : r)));
    await updateBorrowRecord(id, { reviewConducted: val } as any);
  };

  const handleSaveSnapshot = async () => {
    if (!snapName.trim()) { toast.error("Enter a name for the snapshot"); return; }
    await addLeaderboardSnapshot({
      name: snapName.trim(),
      fromDate: settings?.leaderboardFromDate,
      untilDate: format(new Date(), "yyyy-MM-dd"),
      notice: settings?.leaderboardNotice || "",
      entries,
    });
    toast.success("Leaderboard saved");
    setSnapName("");
    await load();
  };

  const handleStartNew = async () => {
    // Set from-date to today, snapshot is already saved separately
    const today = format(new Date(), "yyyy-MM-dd");
    await updateLeaderboardSettings({ leaderboardFromDate: today });
    setSettings((s) => (s ? { ...s, leaderboardFromDate: today } : s));
    toast.success("New leaderboard started from today");
  };

  const handleSettingChange = async (patch: Partial<AdminSettingsT>) => {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    await updateLeaderboardSettings(patch as any);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Trophy className="h-7 w-7 text-primary" />
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold">Leaderboard Management</h1>
          <p className="text-muted-foreground text-sm">Score borrow records and manage snapshots.</p>
        </div>
      </div>

      <Tabs defaultValue="records">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="records">Borrow Records</TabsTrigger>
          <TabsTrigger value="preview">Live Preview</TabsTrigger>
          <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
          <TabsTrigger value="settings">Visibility & Notice</TabsTrigger>
        </TabsList>

        {/* RECORDS */}
        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardContent className="p-4 grid gap-3 sm:grid-cols-4">
              <Input placeholder="Search reader or book..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="not_read">Not read</SelectItem>
                  <SelectItem value="half_read">Half read</SelectItem>
                  <SelectItem value="full_read">Full read</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={load} className="gap-2"><RefreshCw className="h-4 w-4" />Refresh</Button>
            </CardContent>
          </Card>

          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No records match.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((r) => {
                const b = bookMap.get(r.bookId);
                const status = r.readStatus || "not_read";
                return (
                  <Card key={r.id}>
                    <CardContent className="p-3 grid gap-3 md:grid-cols-[1fr_auto] items-start">
                      <div>
                        <p className="font-semibold text-foreground">{r.bookTitle}{r.bookVolume ? ` (Vol. ${r.bookVolume})` : ""}</p>
                        <p className="text-xs text-muted-foreground">
                          <Badge variant="outline" className="mr-1">{b?.category || "—"}</Badge>
                          Borrower: <span className="text-foreground font-medium">{r.borrowerName}</span>
                          {r.borrowerClass && <> · {r.borrowerClass}</>}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Borrowed {format(new Date(r.borrowedDate), "MMM d, yyyy")}
                          {r.isReturned ? ` · Returned` : ` · Not returned yet`}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Select value={status} onValueChange={(v) => handleUpdateStatus(r.id, v as ReadStatus)}>
                          <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_read">Not read</SelectItem>
                            <SelectItem value="half_read">Half read</SelectItem>
                            <SelectItem value="full_read">Full read</SelectItem>
                          </SelectContent>
                        </Select>
                        <label className="flex items-center gap-2 text-xs">
                          <Switch checked={!!r.reviewConducted} onCheckedChange={(v) => handleToggleReview(r.id, v)} />
                          Review conducted
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* PREVIEW */}
        <TabsContent value="preview" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-base">Current Ranking</CardTitle>
              <CardDescription>Live preview of the leaderboard shown to users.</CardDescription>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No scored readers yet.</p>
              ) : (
                <ol className="space-y-1.5">
                  {entries.map((e, i) => (
                    <li key={e.name} className="flex items-center justify-between p-2 rounded-md border border-border bg-card">
                      <span className="flex items-center gap-2 min-w-0">
                        <Badge variant={i < 3 ? "default" : "outline"} className="w-8 justify-center">{i + 1}</Badge>
                        <span className="font-medium truncate">{e.name}</span>
                        {e.className && <span className="text-xs text-muted-foreground">· {e.className}</span>}
                      </span>
                      <span className="text-sm font-semibold text-primary">{e.points} pts</span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SNAPSHOTS */}
        <TabsContent value="snapshots" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-base flex items-center gap-2"><Save className="h-4 w-4" /> Save current as snapshot</CardTitle>
              <CardDescription>Freeze the current leaderboard so users can browse it as a past leaderboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                <Input placeholder="Snapshot name (e.g. Ramadan 2026)" value={snapName} onChange={(e) => setSnapName(e.target.value)} />
                <Button onClick={handleSaveSnapshot} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Save className="h-4 w-4" /> Save snapshot
                </Button>
                <Button variant="outline" onClick={handleStartNew} className="gap-2">
                  <RefreshCw className="h-4 w-4" /> Start new
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">"Start new" sets today as the new leaderboard's start date. Save a snapshot first if you want to keep the old scores.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-base">Past snapshots ({snapshots.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {snapshots.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No snapshots yet.</p>
              ) : (
                <ul className="space-y-2">
                  {snapshots.map((s) => (
                    <li key={s.id} className="flex items-center justify-between p-3 rounded-md border border-border">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.fromDate ? `From ${format(new Date(s.fromDate), "MMM d, yyyy")}` : "From —"}
                          {s.untilDate ? ` · Until ${format(new Date(s.untilDate), "MMM d, yyyy")}` : ""}
                          {" · "}{s.entries.length} readers
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete snapshot?</AlertDialogTitle>
                            <AlertDialogDescription>This permanently removes "{s.name}".</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={async () => { await deleteLeaderboardSnapshot(s.id); toast.success("Deleted"); load(); }}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-base flex items-center gap-2">
                {settings?.leaderboardVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                Visibility
              </CardTitle>
              <CardDescription>Show or hide the leaderboard to users. Optionally set an end date.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={!!settings?.leaderboardVisible}
                  onCheckedChange={(v) => handleSettingChange({ leaderboardVisible: v })}
                />
                <Label className="cursor-pointer">Leaderboard visible to users</Label>
              </div>

              <div className="space-y-2">
                <Label>Show until date (optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full max-w-xs justify-start", !settings?.leaderboardVisibleUntil && "text-muted-foreground")}>
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {settings?.leaderboardVisibleUntil ? format(new Date(settings.leaderboardVisibleUntil), "MMMM d, yyyy") : "No end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={settings?.leaderboardVisibleUntil ? new Date(settings.leaderboardVisibleUntil) : undefined}
                      onSelect={(d) => d && handleSettingChange({ leaderboardVisibleUntil: format(d, "yyyy-MM-dd") })}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {settings?.leaderboardVisibleUntil && (
                  <Button size="sm" variant="ghost" onClick={() => handleSettingChange({ leaderboardVisibleUntil: "" })}>
                    Clear end date
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>Current leaderboard "from" date (optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full max-w-xs justify-start", !settings?.leaderboardFromDate && "text-muted-foreground")}>
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {settings?.leaderboardFromDate ? format(new Date(settings.leaderboardFromDate), "MMMM d, yyyy") : "Not set"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={settings?.leaderboardFromDate ? new Date(settings.leaderboardFromDate) : undefined}
                      onSelect={(d) => d && handleSettingChange({ leaderboardFromDate: format(d, "yyyy-MM-dd") })}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Leaderboard notice</CardTitle>
              <CardDescription>Shown to users at the top of the leaderboard page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={4}
                placeholder="Add a message users should see..."
                value={settings?.leaderboardNotice || ""}
                onChange={(e) => setSettings((s) => (s ? { ...s, leaderboardNotice: e.target.value } : s))}
              />
              <Button
                onClick={() => handleSettingChange({ leaderboardNotice: settings?.leaderboardNotice || "" })}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Save notice
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-base flex items-center gap-2"><Info className="h-4 w-4" /> Scoring rules</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p><strong className="text-foreground">Full read</strong>: Islamic 10 · Science/History/General/Biography 8 · Travelogue/English/Language/Arabic 7 · Story/Novel/English Novel/Poem 4.</p>
              <p><strong className="text-foreground">Half read</strong>: Islamic 4 · Science/History/General/Biography 3 · Travelogue/English/Language/Arabic 2 · Story/Novel/English Novel/Poem 1.</p>
              <p><strong className="text-foreground">Not read</strong>: 0.</p>
              <p><strong className="text-foreground">Review conducted</strong> (only combined with Full read): doubles the full-read points.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeaderboardAdmin;
