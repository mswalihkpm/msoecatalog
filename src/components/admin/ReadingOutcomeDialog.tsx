import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Book, BorrowRecord, ReadingRateVersion } from "@/lib/types";
import {
  RETURN_OPTION_LABELS,
  ReturnOption,
  ScoreResult,
  displayReadingPoints,
  parsePageCount,
  rateForRecord,
  recordReturnOption,
  scoreReading,
} from "@/lib/reading-points";

interface Props {
  record: BorrowRecord | null;
  book?: Book;
  versions: ReadingRateVersion[];
  title: string;
  description?: string;
  confirmLabel: string;
  /** When true, the record keeps its frozen rate (used for corrections). */
  keepFrozenRate?: boolean;
  onClose: () => void;
  onConfirm: (result: ScoreResult) => void | Promise<void>;
}

export const ReadingOutcomeDialog = ({ record, book, versions, title, description, confirmLabel, keepFrozenRate, onClose, onConfirm }: Props) => {
  const [option, setOption] = useState<ReturnOption>("full_read");
  const [pages, setPages] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!record) return;
    const current = keepFrozenRate ? recordReturnOption(record) : "full_read";
    setOption(current);
    setPages(record.pagesRead ? String(record.pagesRead) : "");
  }, [record, keepFrozenRate]);

  const totalPages = parsePageCount(book?.pages);
  const rate = useMemo(
    () => rateForRecord(keepFrozenRate ? record ?? undefined : undefined, book, versions),
    [record, book, versions, keepFrozenRate],
  );
  const customPages = Number(pages);
  const preview = scoreReading(book, option, option === "custom_page" ? customPages : undefined, rate);

  const confirm = async () => {
    if (option === "custom_page") {
      if (!Number.isFinite(customPages) || customPages <= 0) { toast.error("Pages read must be greater than 0"); return; }
      if (totalPages > 0 && customPages > totalPages) { toast.error(`Pages read cannot exceed the book's ${totalPages} pages`); return; }
    }
    setSaving(true);
    try { await onConfirm(preview); } finally { setSaving(false); }
  };

  return (
    <Dialog open={!!record} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description ?? `How much of "${record?.bookTitle}" did ${record?.borrowerName} read?`}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs rounded-md border border-border p-2">
            <span className="text-muted-foreground">Category</span><span className="font-medium">{book?.category || "—"}</span>
            <span className="text-muted-foreground">Total pages</span><span className="font-medium">{totalPages || "Unknown"}</span>
            <span className="text-muted-foreground">Rate (per 10 pages)</span><span className="font-medium">{rate.value.toFixed(2)}</span>
            <span className="text-muted-foreground">Full-read points</span><span className="font-medium">{displayReadingPoints(preview.maxPossiblePoints)}</span>
          </div>
          <Select value={option} onValueChange={(v) => setOption(v as ReturnOption)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["full_read", "half_read", "custom_page", "not_read"] as ReturnOption[]).map((o) => (
                <SelectItem key={o} value={o}>{RETURN_OPTION_LABELS[o]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {option === "custom_page" && (
            <div>
              <Label>Pages read</Label>
              <Input type="number" min={1} max={totalPages || undefined} value={pages} onChange={(e) => setPages(e.target.value)} placeholder="e.g. 75" />
            </div>
          )}
          {totalPages === 0 && option !== "custom_page" && option !== "not_read" && (
            <p className="text-xs text-destructive">This book has no page count, so it earns 0 points. Add its pages in Books, or use Custom pages.</p>
          )}
          <div className="rounded-md bg-primary/10 p-3 text-center">
            <p className="text-xs text-muted-foreground">Points for this reading</p>
            <p className="text-2xl font-bold text-primary">{displayReadingPoints(preview.calculatedPoints)}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={confirm} disabled={saving}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
