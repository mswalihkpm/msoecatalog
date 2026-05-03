import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Upload, Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { getBooks, getPublicationLogos, upsertPublicationLogo, deletePublicationLogo, PublicationLogo } from "@/lib/store";

const PublicationLogosManager = () => {
  const [logos, setLogos] = useState<PublicationLogo[]>([]);
  const [allPubs, setAllPubs] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [newLogoUrl, setNewLogoUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const refresh = async () => {
    const [l, books] = await Promise.all([getPublicationLogos(), getBooks()]);
    setLogos(l);
    const set = new Set<string>();
    books.forEach((b) => {
      const p = (b.publication || "").trim();
      if (p) set.add(p);
    });
    setAllPubs(Array.from(set).sort());
  };

  useEffect(() => { refresh(); }, []);

  const handleUpload = async (file: File): Promise<string | null> => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("publication-logos").upload(path, file);
    setUploading(false);
    if (error) { toast.error("Upload failed"); return null; }
    const { data } = supabase.storage.from("publication-logos").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSaveNew = async () => {
    if (!newName.trim()) { toast.error("Publication name required"); return; }
    await upsertPublicationLogo(newName.trim(), newLogoUrl || null);
    toast.success("Saved");
    setNewName(""); setNewLogoUrl("");
    refresh();
  };

  const handleSetLogoFor = async (name: string, url: string) => {
    await upsertPublicationLogo(name, url);
    toast.success("Logo saved");
    refresh();
  };

  const handleDelete = async (id: string) => {
    await deletePublicationLogo(id);
    refresh();
  };

  const logoByName = new Map(logos.map((l) => [l.publicationName.toLowerCase(), l]));

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Publication Houses
        </CardTitle>
        <CardDescription>
          Set logos for publication houses. Books are automatically grouped by their publication field. Students can browse books filtered by publisher.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add custom new */}
        <div className="space-y-2 p-3 rounded-lg border border-dashed border-border">
          <Label className="text-sm">Add / Update a publication logo manually</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input placeholder="Publication name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Input placeholder="Logo URL (or upload below)" value={newLogoUrl} onChange={(e) => setNewLogoUrl(e.target.value)} />
          </div>
          <div className="flex gap-2 items-center">
            <label>
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return;
                const url = await handleUpload(f);
                if (url) setNewLogoUrl(url);
              }} />
              <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
                <span><Upload className="h-3.5 w-3.5 mr-1" />{uploading ? "Uploading..." : "Upload"}</span>
              </Button>
            </label>
            {newLogoUrl && <img src={newLogoUrl} alt="preview" className="h-10 w-10 rounded object-cover border" />}
            <Button onClick={handleSaveNew} size="sm" className="ml-auto gap-1"><Plus className="h-3.5 w-3.5" /> Save</Button>
          </div>
        </div>

        {/* Auto-detected publications from books */}
        <div className="space-y-2">
          <Label className="text-sm">Detected from books ({allPubs.length})</Label>
          {allPubs.length === 0 ? (
            <p className="text-xs text-muted-foreground">No publication names found in books yet.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {allPubs.map((name) => {
                const existing = logoByName.get(name.toLowerCase());
                return (
                  <div key={name} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-background">
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                      {existing?.logoUrl ? (
                        <img src={existing.logoUrl} alt={name} className="h-full w-full object-cover" />
                      ) : (
                        <Building2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{name}</p>
                    </div>
                    <label>
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const f = e.target.files?.[0]; if (!f) return;
                        const url = await handleUpload(f);
                        if (url) handleSetLogoFor(name, url);
                      }} />
                      <Button variant="outline" size="sm" disabled={uploading} asChild>
                        <span><Upload className="h-3.5 w-3.5 mr-1" />{existing?.logoUrl ? "Change" : "Upload"}</span>
                      </Button>
                    </label>
                    {existing && (
                      <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDelete(existing.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PublicationLogosManager;
