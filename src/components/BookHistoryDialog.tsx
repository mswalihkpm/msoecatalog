import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { BookOpen, Clock } from "lucide-react";

interface Props {
  bookId: string;
  bookTitle: string;
  bookCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BookHistoryDialog = ({ bookId, bookTitle, bookCode, open, onOpenChange }: Props) => {
  const [borrows, setBorrows] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !bookId) return;
    setLoading(true);
    Promise.all([
      supabase.from("borrow_records").select("id, borrower_name, borrower_class, borrowed_date, return_date, is_returned").eq("book_id", bookId).order("borrowed_date", { ascending: false }),
      supabase.from("book_requests").select("id, requester_name, requester_class, request_date, status").eq("book_id", bookId).order("request_date", { ascending: false }),
    ]).then(([b, r]) => {
      setBorrows(b.data || []);
      setRequests(r.data || []);
      setLoading(false);
    });
  }, [open, bookId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">{bookTitle} <span className="text-sm font-normal text-muted-foreground">({bookCode})</span></DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-3"><BookOpen className="h-4 w-4" /> Borrow Records ({borrows.length})</h3>
              {borrows.length === 0 ? <p className="text-sm text-muted-foreground">No borrow records</p> : (
                <div className="space-y-2">
                  {borrows.map((b: any) => (
                    <div key={b.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="font-medium text-sm">{b.borrower_name}{b.borrower_class ? ` (${b.borrower_class})` : ""}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Borrowed: {format(new Date(b.borrowed_date), "MMM d, yyyy")} → Return: {format(new Date(b.return_date), "MMM d, yyyy")}
                      </p>
                      <Badge variant={b.is_returned ? "secondary" : "destructive"} className="mt-1 text-xs">
                        {b.is_returned ? "Returned" : "Not Returned"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-3"><Clock className="h-4 w-4" /> Book Requests ({requests.length})</h3>
              {requests.length === 0 ? <p className="text-sm text-muted-foreground">No requests</p> : (
                <div className="space-y-2">
                  {requests.map((r: any) => (
                    <div key={r.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="font-medium text-sm">{r.requester_name}{r.requester_class ? ` (${r.requester_class})` : ""}</p>
                      <p className="text-xs text-muted-foreground mt-1">Date: {format(new Date(r.request_date), "MMM d, yyyy")}</p>
                      <Badge variant={r.status === "approved" ? "secondary" : r.status === "rejected" ? "destructive" : "outline"} className="mt-1 text-xs">
                        {r.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
