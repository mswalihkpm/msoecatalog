import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StarRating } from "@/components/StarRating";
import { StudentSearch } from "@/components/StudentSearch";
import { Header } from "@/components/Header";
import { FileText, Image as ImageIcon, Video, FileSpreadsheet, File, Download, Eye, Star, MessageSquare, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Student } from "@/lib/types";

interface StoreItem {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  cover_image: string | null;
  average_rating: number;
  total_reviews: number;
  created_at: string;
}

interface StoreReview {
  id: string;
  item_id: string;
  user_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

const typeIcon = (t: string) => {
  switch (t) {
    case "pdf": return <FileText className="h-5 w-5" />;
    case "image": return <ImageIcon className="h-5 w-5" />;
    case "video": return <Video className="h-5 w-5" />;
    case "spreadsheet": return <FileSpreadsheet className="h-5 w-5" />;
    default: return <File className="h-5 w-5" />;
  }
};

const formatSize = (b?: number | null) => {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

const Store = () => {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<StoreItem | null>(null);
  const [viewing, setViewing] = useState<StoreItem | null>(null);
  const [reviews, setReviews] = useState<StoreReview[]>([]);

  // review form state
  const [studentRating, setStudentRating] = useState<Student | null>(null);
  const [studentReview, setStudentReview] = useState<Student | null>(null);
  const [ratingVal, setRatingVal] = useState(0);
  const [comment, setComment] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("store_items").select("*").order("created_at", { ascending: false });
    setItems((data as StoreItem[]) || []);
    setLoading(false);
  };

  const loadReviews = async (itemId: string) => {
    const { data } = await supabase.from("store_reviews").select("*").eq("item_id", itemId).order("created_at", { ascending: false });
    setReviews((data as StoreReview[]) || []);
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter(i =>
    (filter === "all" || i.file_type === filter) &&
    (search === "" || i.title.toLowerCase().includes(search.toLowerCase()))
  );

  const openItem = async (item: StoreItem) => {
    setSelected(item);
    setStudentRating(null); setStudentReview(null); setRatingVal(0); setComment("");
    await loadReviews(item.id);
  };

  const download = async (item: StoreItem) => {
    try {
      const res = await fetch(item.file_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.file_name;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(item.file_url, "_blank");
    }
  };

  const submitRating = async () => {
    if (!studentRating) return toast.error("Please select your name");
    if (ratingVal === 0) return toast.error("Please select a rating");
    if (!selected) return;
    await supabase.from("store_reviews").insert({ item_id: selected.id, user_name: "Anonymous", rating: ratingVal, comment: "" });
    toast.success("Rating submitted!");
    setStudentRating(null); setRatingVal(0);
    await loadReviews(selected.id); await load();
    setSelected(items.find(i => i.id === selected.id) || selected);
  };

  const submitReview = async () => {
    if (!studentReview) return toast.error("Please select your name");
    if (!comment.trim()) return toast.error("Please write a review");
    if (!selected) return;
    await supabase.from("store_reviews").insert({
      item_id: selected.id,
      user_name: `${studentReview.name} (${studentReview.class})`,
      rating: 0, comment: comment.trim(),
    });
    toast.success("Review submitted!");
    setStudentReview(null); setComment("");
    await loadReviews(selected.id);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="font-serif text-2xl md:text-3xl font-bold mb-2">Store</h1>
          <p className="text-sm text-muted-foreground">Library resources shared by admin — read, watch, download.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pdf">PDF</TabsTrigger>
              <TabsTrigger value="image">Images</TabsTrigger>
              <TabsTrigger value="video">Videos</TabsTrigger>
              <TabsTrigger value="spreadsheet">Sheets</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No items found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition cursor-pointer border-primary/20" onClick={() => openItem(item)}>
                <div className={`${item.cover_image ? "aspect-[3/4]" : "aspect-video"} bg-muted flex items-center justify-center relative overflow-hidden`}>
                  {item.cover_image ? (
                    <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover" />
                  ) : item.file_type === "image" ? (
                    <img src={item.file_url} alt={item.title} className="w-full h-full object-cover" />
                  ) : item.file_type === "video" ? (
                    <video src={item.file_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-primary scale-[2.5]">{typeIcon(item.file_type)}</div>
                  )}
                  <Badge className="absolute top-1 right-1 text-[10px] uppercase">{item.file_type}</Badge>
                </div>
                <CardContent className="p-2 sm:p-3 space-y-1">
                  <h3 className="font-semibold text-sm line-clamp-2 leading-tight">{item.title}</h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      {item.average_rating.toFixed(1)}
                    </span>
                    <span>{formatSize(item.file_size)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Item detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {typeIcon(selected.file_type)} {selected.title}
                </DialogTitle>
              </DialogHeader>
              {selected.description && <p className="text-sm text-muted-foreground">{selected.description}</p>}
              <div className="text-xs text-muted-foreground">
                {selected.file_name} • {formatSize(selected.file_size)} • {format(new Date(selected.created_at), "MMM d, yyyy")}
              </div>
              <div className="flex items-center gap-2">
                <StarRating rating={Math.round(selected.average_rating)} readonly size="sm" />
                <span className="text-sm text-muted-foreground">({selected.total_reviews} reviews)</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {(selected.file_type === "pdf" || selected.file_type === "image" || selected.file_type === "video") && (
                  <Button onClick={() => setViewing(selected)} className="gap-2">
                    <Eye className="h-4 w-4" /> {selected.file_type === "video" ? "Play Now" : "Read Now"}
                  </Button>
                )}
                <Button variant="outline" onClick={() => download(selected)} className="gap-2">
                  <Download className="h-4 w-4" /> Download
                </Button>
              </div>

              <Tabs defaultValue="rating" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="rating" className="gap-2"><Star className="h-4 w-4" />Rate</TabsTrigger>
                  <TabsTrigger value="review" className="gap-2"><MessageSquare className="h-4 w-4" />Review</TabsTrigger>
                </TabsList>
                <TabsContent value="rating" className="space-y-3 pt-3">
                  <Label>Select Your Name</Label>
                  <StudentSearch onSelect={setStudentRating} selectedStudent={studentRating} />
                  <Label>Your Rating</Label>
                  <StarRating rating={ratingVal} onRatingChange={setRatingVal} size="lg" />
                  <Button onClick={submitRating} className="w-full">Submit Rating</Button>
                </TabsContent>
                <TabsContent value="review" className="space-y-3 pt-3">
                  <Label>Select Your Name</Label>
                  <StudentSearch onSelect={setStudentReview} selectedStudent={studentReview} />
                  <Label>Your Review</Label>
                  <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={500} placeholder="Share your thoughts..." />
                  <Button onClick={submitReview} className="w-full">Submit Review</Button>
                </TabsContent>
              </Tabs>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Reviews</h4>
                {reviews.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No reviews yet.</p>
                ) : reviews.map(r => (
                  <Card key={r.id} className="bg-muted/40">
                    <CardContent className="pt-3 pb-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{r.user_name}</span>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy")}</span>
                      </div>
                      {r.rating > 0 && <StarRating rating={r.rating} readonly size="sm" />}
                      {r.comment && <p className="text-xs text-muted-foreground">{r.comment}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Viewer */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-2 sm:p-4">
          {viewing && (
            <div className="w-full h-full flex flex-col">
              <DialogHeader><DialogTitle className="text-sm">{viewing.title}</DialogTitle></DialogHeader>
              <div className="flex-1 overflow-hidden mt-2">
                {viewing.file_type === "pdf" && (
                  <iframe src={viewing.file_url} className="w-full h-full border rounded" title={viewing.title} />
                )}
                {viewing.file_type === "image" && (
                  <img src={viewing.file_url} alt={viewing.title} className="w-full h-full object-contain" />
                )}
                {viewing.file_type === "video" && (
                  <video src={viewing.file_url} controls autoPlay className="w-full h-full" />
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Store;
