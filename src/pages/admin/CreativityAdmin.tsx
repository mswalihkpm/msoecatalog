import { useEffect, useRef, useState } from "react";
import { Sparkles, Upload, Trash2, Loader2, FileText, Video, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StudentSearch } from "@/components/StudentSearch";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  getCreativeWorks, addCreativeWork, deleteCreativeWork, uploadCreativeFile,
  getAdminSettings, updateCreativityCategories,
} from "@/lib/store";
import { CreativeWork, Student } from "@/lib/types";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const detectType = (file: File): CreativeWork["fileType"] => {
  const m = file.type;
  if (m.startsWith("image/")) return "image";
  if (m === "application/pdf") return "pdf";
  if (m.startsWith("video/")) return "video";
  const name = file.name.toLowerCase();
  if (/\.(png|jpe?g|webp|gif)$/.test(name)) return "image";
  if (/\.pdf$/.test(name)) return "pdf";
  return "video";
};

const CreativityAdmin = () => {
  const [works, setWorks] = useState<CreativeWork[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCat, setNewCat] = useState("");
  const [title, setTitle] = useState("");
  const [writerStudent, setWriterStudent] = useState<Student | null>(null);
  const [writerFree, setWriterFree] = useState(""); // fallback when not a student
  const [media, setMedia] = useState("");
  const [category, setCategory] = useState<string>("");
  const [date, setDate] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [w, s] = await Promise.all([getCreativeWorks(), getAdminSettings()]);
    setWorks(w);
    setCategories(s.creativityCategories || []);
  };
  useEffect(() => { load(); }, []);

  const addCategory = async () => {
    const c = newCat.trim();
    if (!c) return;
    if (categories.includes(c)) { toast.error("Category already exists"); return; }
    const next = [...categories, c];
    setCategories(next);
    await updateCreativityCategories(next);
    setNewCat("");
    toast.success(`Added "${c}"`);
  };

  const removeCategory = async (c: string) => {
    const next = categories.filter((x) => x !== c);
    setCategories(next);
    await updateCreativityCategories(next);
    toast.success(`Removed "${c}"`);
  };

  const reset = () => {
    setTitle(""); setWriterStudent(null); setWriterFree(""); setMedia(""); setCategory("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setFile(null); setCover(null);
    if (fileRef.current) fileRef.current.value = "";
    if (coverRef.current) coverRef.current.value = "";
  };

  const submit = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!file) { toast.error("Select a file to upload"); return; }
    setUploading(true); setProgress(0);
    try {
      const type = detectType(file);
      const url = await uploadCreativeFile(file, setProgress);
      if (!url) { toast.error("Upload failed"); return; }
      let coverUrl: string | undefined;
      if (type === "pdf" && cover) {
        const c = await uploadCreativeFile(cover);
        if (c) coverUrl = c;
      }
      const writer = writerStudent ? `${writerStudent.name}${writerStudent.class ? ` (${writerStudent.class})` : ""}` : writerFree.trim() || undefined;
      const created = await addCreativeWork({
        title: title.trim(),
        writer,
        media: media.trim() || undefined,
        category: category || undefined,
        workDate: date,
        fileUrl: url,
        fileType: type,
        coverUrl,
      });
      if (created) { toast.success("Uploaded"); reset(); load(); }
      else toast.error("Failed to save work");
    } finally {
      setUploading(false); setProgress(0);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Sparkles className="h-7 w-7 text-primary" />
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold">Creativity Hub</h1>
          <p className="text-muted-foreground text-sm">Upload creative works and manage categories.</p>
        </div>
      </div>

      {/* Categories manager */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-base">Categories</CardTitle>
          <CardDescription>Add categories students can select from when browsing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {categories.length === 0 && <p className="text-xs text-muted-foreground">No categories yet.</p>}
            {categories.map((c) => (
              <Badge key={c} variant="secondary" className="gap-1 pr-1">
                {c}
                <button onClick={() => removeCategory(c)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Add new category…" value={newCat} onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCategory(); } }} />
            <Button onClick={addCategory} className="gap-1"><Plus className="h-4 w-4" />Add</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-base">Upload new work</CardTitle>
          <CardDescription>Supported: png, jpg, jpeg, pdf, videos.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title of the work" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Author / Writer <span className="text-xs text-muted-foreground">(pick a registered student or type below)</span></Label>
            <StudentSearch
              onSelect={setWriterStudent}
              selectedStudent={writerStudent}
              skipCodeVerify
              placeholder="Search student to attribute…"
            />
            {!writerStudent && (
              <Input className="mt-2" placeholder="Or type writer name manually" value={writerFree} onChange={(e) => setWriterFree(e.target.value)} />
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category || "none"} onValueChange={(v) => setCategory(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Pick a category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— No category —</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Media (optional)</Label>
            <Input value={media} onChange={(e) => setMedia(e.target.value)} placeholder="e.g. Magazine, Instagram, Blog" />
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>File</Label>
            <Input ref={fileRef} type="file" accept="image/png,image/jpeg,image/jpg,application/pdf,video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {file && <p className="text-xs text-muted-foreground truncate">Selected: {file.name}</p>}
          </div>
          {file && detectType(file) === "pdf" && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Cover image for PDF (optional)</Label>
              <Input ref={coverRef} type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] ?? null)} />
            </div>
          )}
          {uploading && (
            <div className="sm:col-span-2 space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading… {Math.round(progress)}%
              </div>
              <Progress value={progress} />
            </div>
          )}
          <div className="sm:col-span-2">
            <Button onClick={submit} disabled={uploading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload work"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-base">Existing works ({works.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {works.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No works uploaded yet.</p>
          ) : (
            <ul className="space-y-2">
              {works.map((w) => (
                <li key={w.id} className="flex items-center gap-3 p-3 rounded-md border border-border">
                  <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0">
                    {w.fileType === "image" ? <img src={w.fileUrl} alt={w.title} className="w-full h-full object-cover" />
                      : w.coverUrl ? <img src={w.coverUrl} alt={w.title} className="w-full h-full object-cover" />
                      : w.fileType === "pdf" ? <FileText className="h-5 w-5 text-primary" />
                      : <Video className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{w.title}</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {w.writer && <Badge variant="outline" className="text-[10px]">{w.writer}</Badge>}
                      {w.category && <Badge className="text-[10px] bg-primary/70 text-primary-foreground">{w.category}</Badge>}
                      {w.media && <Badge variant="secondary" className="text-[10px]">{w.media}</Badge>}
                      <Badge variant="outline" className="text-[10px]">{format(new Date(w.workDate), "MMM d, yyyy")}</Badge>
                      <Badge className="text-[10px] bg-primary/80 text-primary-foreground">{w.fileType}</Badge>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{w.title}"?</AlertDialogTitle>
                        <AlertDialogDescription>The file stays in storage but the entry is removed from the hub.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={async () => { await deleteCreativeWork(w.id); toast.success("Deleted"); load(); }}>
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
    </div>
  );
};

export default CreativityAdmin;
