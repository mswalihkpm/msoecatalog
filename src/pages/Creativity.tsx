import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Search, ArrowLeft, FileText, Image as ImageIcon, Video, Play, User, CalendarDays } from "lucide-react";
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, isAfter, parseISO } from "date-fns";
import { getCreativeWorks, getAdminSettings } from "@/lib/store";
import { CreativeWork } from "@/lib/types";
import { Link } from "react-router-dom";
import creativityLogo from "@/assets/creativity-logo.png.asset.json";

type TimeFilter = "all" | "day" | "week" | "month" | "year";

const iconFor = (t: string) => t === "pdf" ? <FileText className="h-5 w-5" /> : t === "video" ? <Video className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />;

const Creativity = () => {
  const [works, setWorks] = useState<CreativeWork[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [searchBy, setSearchBy] = useState<"all" | "title" | "writer" | "media" | "date" | "month">("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [mediaFilter, setMediaFilter] = useState<string>("all");
  const [selected, setSelected] = useState<CreativeWork | null>(null);

  useEffect(() => {
    Promise.all([getCreativeWorks(), getAdminSettings()])
      .then(([w, s]) => { setWorks(w); setCategories(s.creativityCategories || []); })
      .finally(() => setLoading(false));
  }, []);

  const mediaOptions = useMemo(() => {
    const s = new Set<string>();
    works.forEach((w) => w.media && s.add(w.media));
    return Array.from(s).sort();
  }, [works]);

  const filtered = useMemo(() => {
    let out = works;

    if (timeFilter !== "all") {
      const now = new Date();
      const from =
        timeFilter === "day" ? startOfDay(now)
        : timeFilter === "week" ? startOfWeek(now, { weekStartsOn: 1 })
        : timeFilter === "month" ? startOfMonth(now)
        : startOfYear(now);
      out = out.filter((w) => isAfter(parseISO(w.workDate), from) || parseISO(w.workDate).getTime() === from.getTime());
    }
    if (mediaFilter !== "all") out = out.filter((w) => (w.media || "").toLowerCase() === mediaFilter.toLowerCase());
    if (categoryFilter !== "all") out = out.filter((w) => (w.category || "") === categoryFilter);

    const query = q.trim().toLowerCase();
    if (query) {
      out = out.filter((w) => {
        const dateStr = w.workDate;
        const monthStr = format(parseISO(w.workDate), "MMMM").toLowerCase();
        const monthNum = format(parseISO(w.workDate), "MM");
        if (searchBy === "title") return w.title.toLowerCase().includes(query);
        if (searchBy === "writer") return (w.writer || "").toLowerCase().includes(query);
        if (searchBy === "media") return (w.media || "").toLowerCase().includes(query);
        if (searchBy === "date") return dateStr.includes(query);
        if (searchBy === "month") return monthStr.includes(query) || monthNum === query;
        return (
          w.title.toLowerCase().includes(query) ||
          (w.writer || "").toLowerCase().includes(query) ||
          (w.media || "").toLowerCase().includes(query) ||
          dateStr.includes(query) ||
          monthStr.includes(query)
        );
      });
    }

    return out;
  }, [works, timeFilter, mediaFilter, q, searchBy]);

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <Header />
      <main className="container px-4 py-8 relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div className="flex items-center gap-3">
            <img src={creativityLogo.url} alt="Creativity" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">Creativity Hub</h1>
              <p className="text-sm text-muted-foreground">Creative publications from our community</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid gap-3 sm:grid-cols-5 mb-4">
          <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="day">This day</SelectItem>
              <SelectItem value="week">This week</SelectItem>
              <SelectItem value="month">This month</SelectItem>
              <SelectItem value="year">This year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={mediaFilter} onValueChange={setMediaFilter}>
            <SelectTrigger><SelectValue placeholder="Media" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All media</SelectItem>
              {mediaOptions.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={searchBy} onValueChange={(v) => setSearchBy(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Search all</SelectItem>
              <SelectItem value="title">By title</SelectItem>
              <SelectItem value="writer">By writer</SelectItem>
              <SelectItem value="media">By media</SelectItem>
              <SelectItem value="date">By date (yyyy-mm-dd)</SelectItem>
              <SelectItem value="month">By month</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-12">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No creative works yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map((w) => (
              <button key={w.id} onClick={() => setSelected(w)} className="text-left group">
                <Card className="overflow-hidden h-full transition-all hover:border-primary/50 hover:shadow-teal">
                  <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden relative">
                    {w.fileType === "image" ? (
                      <img src={w.fileUrl} alt={w.title} className="w-full h-full object-cover" />
                    ) : w.coverUrl ? (
                      <img src={w.coverUrl} alt={w.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-primary">
                        {iconFor(w.fileType)}
                        <span className="text-[10px] uppercase font-semibold">{w.fileType}</span>
                      </div>
                    )}
                    {w.fileType === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="h-8 w-8 text-white" fill="white" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-2 space-y-1">
                    <p className="text-xs font-semibold truncate">{w.title}</p>
                    {w.writer && <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1"><User className="h-2.5 w-2.5" />{w.writer}</p>}
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><CalendarDays className="h-2.5 w-2.5" />{format(parseISO(w.workDate), "MMM d, yyyy")}</p>
                    <div className="flex flex-wrap gap-1">
                      {w.category && <Badge className="text-[9px] px-1 bg-primary/70 text-primary-foreground">{w.category}</Badge>}
                      {w.media && <Badge variant="secondary" className="text-[9px] px-1">{w.media}</Badge>}
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}

        <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selected?.title}</DialogTitle>
            </DialogHeader>
            {selected && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {selected.writer && <span>By <strong className="text-foreground">{selected.writer}</strong></span>}
                  <span>· {format(parseISO(selected.workDate), "MMMM d, yyyy")}</span>
                  {selected.media && <Badge variant="secondary">{selected.media}</Badge>}
                </div>
                <div className="rounded-md overflow-hidden bg-muted">
                  {selected.fileType === "image" ? (
                    <img src={selected.fileUrl} alt={selected.title} className="w-full h-auto" />
                  ) : selected.fileType === "video" ? (
                    <video src={selected.fileUrl} controls className="w-full h-auto" />
                  ) : (
                    <iframe src={selected.fileUrl} title={selected.title} className="w-full h-[70vh]" />
                  )}
                </div>
                <a href={selected.fileUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="w-full">Open in new tab</Button>
                </a>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Creativity;
