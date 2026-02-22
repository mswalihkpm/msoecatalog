import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Megaphone, GripVertical, Upload, X } from "lucide-react";

interface Poster {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  book_id: string | null;
  is_active: boolean;
  display_order: number;
}

const PostersManagement = () => {
  const [posters, setPosters] = useState<Poster[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPoster, setEditingPoster] = useState<Poster | null>(null);
  const [form, setForm] = useState({ title: "", description: "", image_url: "", book_id: "", is_active: true });
  const [uploading, setUploading] = useState(false);

  const fetchPosters = async () => {
    const { data } = await supabase
      .from("promotional_posters")
      .select("*")
      .order("display_order", { ascending: true });
    if (data) setPosters(data as Poster[]);
  };

  useEffect(() => { fetchPosters(); }, []);

  const openCreate = () => {
    setEditingPoster(null);
    setForm({ title: "", description: "", image_url: "", book_id: "", is_active: true });
    setIsDialogOpen(true);
  };

  const openEdit = (p: Poster) => {
    setEditingPoster(p);
    setForm({
      title: p.title,
      description: p.description || "",
      image_url: p.image_url || "",
      book_id: p.book_id || "",
      is_active: p.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    const payload = {
      title: form.title,
      description: form.description || null,
      image_url: form.image_url || null,
      book_id: form.book_id || null,
      is_active: form.is_active,
    };

    if (editingPoster) {
      await supabase.from("promotional_posters").update(payload).eq("id", editingPoster.id);
      toast.success("Poster updated");
    } else {
      await supabase.from("promotional_posters").insert({ ...payload, display_order: posters.length });
      toast.success("Poster added");
    }
    setIsDialogOpen(false);
    fetchPosters();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("promotional_posters").delete().eq("id", id);
    toast.success("Poster deleted");
    fetchPosters();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("promotional_posters").update({ is_active: !current }).eq("id", id);
    fetchPosters();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Promotional Posters</h1>
          <p className="text-muted-foreground text-sm">Manage homepage banner advertisements</p>
        </div>
        <Button onClick={openCreate} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" /> Add Poster
        </Button>
      </div>

      {posters.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No posters yet. Create one to advertise new books!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posters.map((poster) => (
            <Card key={poster.id} className={`border ${poster.is_active ? "border-primary/30" : "border-border opacity-60"}`}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0 hidden sm:block" />
                    {poster.image_url ? (
                      <img src={poster.image_url} alt={poster.title} className="h-14 w-20 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="h-14 w-20 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Megaphone className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{poster.title}</h3>
                      {poster.description && <p className="text-xs text-muted-foreground truncate">{poster.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <Switch checked={poster.is_active} onCheckedChange={() => toggleActive(poster.id, poster.is_active)} />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(poster)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(poster.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">{editingPoster ? "Edit Poster" : "Add Poster"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div>
              <Label>Poster Image</Label>
              <div className="space-y-2">
                {form.image_url && (
                  <div className="relative inline-block">
                    <img src={form.image_url} alt="Preview" className="h-24 w-40 rounded-lg object-cover border" />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, image_url: "" }))}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploading(true);
                        const ext = file.name.split(".").pop();
                        const path = `${Date.now()}.${ext}`;
                        const { error } = await supabase.storage.from("promotional-posters").upload(path, file);
                        if (error) { toast.error("Upload failed"); setUploading(false); return; }
                        const { data: urlData } = supabase.storage.from("promotional-posters").getPublicUrl(path);
                        setForm(f => ({ ...f, image_url: urlData.publicUrl }));
                        setUploading(false);
                        toast.success("Image uploaded");
                      }}
                    />
                    <Button type="button" variant="outline" className="w-full gap-2" disabled={uploading} asChild>
                      <span><Upload className="h-4 w-4" />{uploading ? "Uploading..." : "Upload from PC"}</span>
                    </Button>
                  </label>
                </div>
                <Input
                  value={form.image_url}
                  onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  placeholder="Or paste image URL..."
                  className="text-xs"
                />
              </div>
            </div>
            <div><Label>Book ID (optional, links poster to a book)</Label><Input value={form.book_id} onChange={e => setForm(f => ({ ...f, book_id: e.target.value }))} placeholder="UUID of the book" /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingPoster ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PostersManagement;
