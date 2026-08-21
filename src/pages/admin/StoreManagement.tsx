import { LoadingLogo } from "@/components/LoadingLogo";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Upload, Trash2, FileText, Image as ImageIcon, Video, FileSpreadsheet, File as FileIcon, Pencil } from "lucide-react";
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

const uploadWithProgress = async (
  bucket: string,
  path: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<string> => {
  const { data: signed, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
  if (error || !signed) throw new Error(error?.message || "Failed to get upload URL");

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signed.signedUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
};

const StoreManagement = () => {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StoreItem | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileProgress, setFileProgress] = useState(0);
  const [coverProgress, setCoverProgress] = useState(0);
  const [phase, setPhase] = useState<"" | "file" | "cover" | "saving">("");
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("store_items").select("*").order("created_at", { ascending: false });
    setItems((data as StoreItem[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const reset = () => {
    setTitle(""); setDescription(""); setFile(null); setCoverFile(null);
    setFileProgress(0); setCoverProgress(0); setPhase("");
    setEditing(null);
    if (fileRef.current) fileRef.current.value = "";
    if (coverRef.current) coverRef.current.value = "";
  };

  const openCreate = () => { reset(); setOpen(true); };
  const openEdit = (item: StoreItem) => {
    reset();
    setEditing(item);
    setTitle(item.title);
    setDescription(item.description || "");
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error("Please enter a title");
    if (!editing && !file) return toast.error("Please select a file");

    setUploading(true);
    try {
      let fileUrl = editing?.file_url;
      let fileType = editing?.file_type;
      let fileName = editing?.file_name;
      let fileSize: number | null = editing?.file_size ?? null;
      let mimeType: string | null = editing?.mime_type ?? null;
      let coverUrl: string | null = editing?.cover_image ?? null;

      if (file) {
        setPhase("file");
        const ext = file.name.split(".").pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        fileUrl = await uploadWithProgress("store-items", path, file, setFileProgress);
        fileType = detectType(file.type);
        fileName = file.name;
        fileSize = file.size;
        mimeType = file.type;
      }

      if (coverFile) {
        setPhase("cover");
        const cExt = coverFile.name.split(".").pop();
        const cPath = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${cExt}`;
        coverUrl = await uploadWithProgress("store-items", cPath, coverFile, setCoverProgress);
      }

      setPhase("saving");
      if (editing) {
        const { error } = await supabase.from("store_items").update({
          title: title.trim(),
          description: description.trim() || null,
          file_url: fileUrl!,
          file_type: fileType!,
          file_name: fileName!,
          file_size: fileSize,
          mime_type: mimeType,
          cover_image: coverUrl,
        }).eq("id", editing.id);
        if (error) throw error;
        toast.success("Item updated!");
      } else {
        const { error } = await supabase.from("store_items").insert({
          title: title.trim(),
          description: description.trim() || null,
          file_url: fileUrl!,
          file_type: fileType!,
          file_name: fileName!,
          file_size: fileSize,
          mime_type: mimeType,
          cover_image: coverUrl,
        });
        if (error) throw error;
        toast.success("Item uploaded!");
      }

      reset(); setOpen(false); load();
    } catch (e: any) {
      toast.error(e.message || "Operation failed");
    } finally {
      setUploading(false);
      setPhase("");
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
        <Button onClick={openCreate} className="gap-2"><Upload className="h-4 w-4" /> Upload</Button>
      </div>

      {loading ? (
        <div className="py-8"><LoadingLogo text="Loading items..." /></div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">No items yet. Upload your first file.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(item => (
            <Card key={item.id} className="overflow-hidden">
              {item.cover_image && (
                <div className="aspect-[3/4] bg-muted overflow-hidden">
                  <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover" />
                </div>
              )}
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="secondary" className="gap-1 uppercase text-[10px]">{typeIcon(item.file_type)}{item.file_type}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)} className="h-8 w-8">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item)} className="h-8 w-8 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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

      <Dialog open={open} onOpenChange={(o) => { if (!uploading) { setOpen(o); if (!o) reset(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Store Item" : "Upload Store Item"}</DialogTitle></DialogHeader>
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
              <Label>{editing ? "Replace File (optional)" : "File *"} (PDF, images, videos, Excel, etc.)</Label>
              <Input ref={fileRef} type="file" onChange={(e) => { setFile(e.target.files?.[0] || null); setFileProgress(0); }}
                accept=".pdf,.xlsx,.xls,.csv,image/*,video/*" />
              {file && <p className="text-xs text-muted-foreground mt-1">{file.name} • {formatSize(file.size)}</p>}
              {(phase === "file" || (fileProgress > 0 && fileProgress < 100)) && file && (
                <div className="mt-2 space-y-1">
                  <Progress value={fileProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">{fileProgress}%</p>
                </div>
              )}
              {editing && !file && (
                <p className="text-xs text-muted-foreground mt-1">Current: {editing.file_name}</p>
              )}
            </div>
            <div>
              <Label>Cover Photo (optional, displayed in 3:4)</Label>
              <Input ref={coverRef} type="file" accept="image/*" onChange={(e) => { setCoverFile(e.target.files?.[0] || null); setCoverProgress(0); }} />
              {coverFile && (
                <div className="mt-2 w-24 aspect-[3/4] rounded overflow-hidden border">
                  <img src={URL.createObjectURL(coverFile)} alt="cover preview" className="w-full h-full object-cover" />
                </div>
              )}
              {!coverFile && editing?.cover_image && (
                <div className="mt-2 w-24 aspect-[3/4] rounded overflow-hidden border">
                  <img src={editing.cover_image} alt="current cover" className="w-full h-full object-cover" />
                </div>
              )}
              {(phase === "cover" || (coverProgress > 0 && coverProgress < 100)) && coverFile && (
                <div className="mt-2 space-y-1">
                  <Progress value={coverProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">{coverProgress}%</p>
                </div>
              )}
            </div>
            {phase === "saving" && <p className="text-xs text-muted-foreground">Saving...</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={uploading}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={uploading}>
              {uploading
                ? phase === "file"
                  ? `Uploading file ${fileProgress}%`
                  : phase === "cover"
                  ? `Uploading cover ${coverProgress}%`
                  : "Saving..."
                : editing ? "Save Changes" : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StoreManagement;
