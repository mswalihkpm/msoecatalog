import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Upload, Trash2, FileText, Image as ImageIcon, Video, FileSpreadsheet, File as FileIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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

const detectType = (mime: string): string => {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf") return "pdf";
  if (mime.includes("spreadsheet") || mime.includes("excel") || mime === "text/csv") return "spreadsheet";
  return "other";
};

const typeIcon = (t: string) => {
  switch (t) {
    case "pdf": return <FileText className="h-4 w-4" />;
    case "image": return <ImageIcon className="h-4 w-4" />;
    case "video": return <Video className="h-4 w-4" />;
    case "spreadsheet": return <FileSpreadsheet className="h-4 w-4" />;
    default: return <FileIcon className="h-4 w-4" />;
  }
};

const formatSize = (b?: number | null) => {
  if (!b) return "";
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

const StoreManagement = () => {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("store_items").select("*").order("created_at", { ascending: false });
    setItems((data as StoreItem[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const reset = () => {
    setTitle(""); setDescription(""); setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!file) return toast.error("Please select a file");
    if (!title.trim()) return toast.error("Please enter a title");

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("store-items").upload(path, file, {
        contentType: file.type, upsert: false,
      });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("store-items").getPublicUrl(path);

      const { error: insErr } = await supabase.from("store_items").insert({
        title: title.trim(),
        description: description.trim() || null,
        file_url: urlData.publicUrl,
        file_type: detectType(file.type),
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      });
      if (insErr) throw insErr;

      toast.success("Item uploaded!");
      reset(); setOpen(false); load();
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item: StoreItem) => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    try {
      const url = new URL(item.file_url);
      const path = url.pathname.split("/store-items/")[1];
      if (path) await supabase.storage.from("store-items").remove([path]);
      await supabase.from("store_items").delete().eq("id", item.id);
      toast.success("Deleted");
      load();
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Store Management</h1>
          <p className="text-sm text-muted-foreground">Upload PDFs, images, videos, spreadsheets for users.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2"><Upload className="h-4 w-4" /> Upload</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">No items yet. Upload your first file.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(item => (
            <Card key={item.id}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="secondary" className="gap-1 uppercase text-[10px]">{typeIcon(item.file_type)}{item.file_type}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item)} className="h-8 w-8 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <h3 className="font-semibold text-sm line-clamp-2">{item.title}</h3>
                {item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
                <div className="text-[11px] text-muted-foreground flex justify-between">
                  <span>{formatSize(item.file_size)}</span>
                  <span>★ {item.average_rating.toFixed(1)} ({item.total_reviews})</span>
                </div>
                <div className="text-[10px] text-muted-foreground truncate">{item.file_name}</div>
                <div className="text-[10px] text-muted-foreground">{format(new Date(item.created_at), "MMM d, yyyy")}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Store Item</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Item title" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Optional description" />
            </div>
            <div>
              <Label>File * (PDF, images, videos, Excel, etc.)</Label>
              <Input ref={fileRef} type="file" onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept=".pdf,.xlsx,.xls,.csv,image/*,video/*" />
              {file && <p className="text-xs text-muted-foreground mt-1">{file.name} • {formatSize(file.size)}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={uploading}>Cancel</Button>
            <Button onClick={handleUpload} disabled={uploading}>{uploading ? "Uploading..." : "Upload"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StoreManagement;
