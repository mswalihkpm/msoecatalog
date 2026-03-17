import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { BookOpen, Clock } from "lucide-react";

interface Props {
  studentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BorrowEntry {
  id: string;
  book_title: string;
  book_volume: string | null;
  borrowed_date: string;
  return_date: string;
  is_returned: boolean;
}

interface RequestEntry {
  id: string;
  book_title: string;
  book_number_code: string;
  book_volume: string | null;
  request_date: string;
  status: string;
}

export const StudentHistoryDialog = ({ studentName, open, onOpenChange }: Props) => {
  const [borrows, setBorrows] = useState<BorrowEntry[]>([]);
  const [requests, setRequests] = useState<RequestEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !studentName) return;
    setLoading(true);
    Promise.all([
      supabase.from("borrow_records").select("id, book_title, book_volume, borrowed_date, return_date, is_returned").eq("borrower_name", studentName).order("borrowed_date", { ascending: false }),
      supabase.from("book_requests").select("id, book_title, book_number_code, book_volume, request_date, status").eq("requester_name", studentName).order("request_date", { ascending: false }),
    ]).then(([b, r]) => {
      setBorrows(b.data || []);
      setRequests(r.data || []);
      setLoading(false);
    });
  }, [open, studentName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">History: {studentName}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-3"><BookOpen className="h-4 w-4" /> Borrow Records ({borrows.length})</h3>
              {borrows.length === 0 ? <p className="text-sm text-muted-foreground">No borrow records</p> : (
                <div className="space-y-2">
                  {borrows.map((b) => (
                    <div key={b.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="font-medium text-sm">{b.book_title}{b.book_volume ? ` (Vol. ${b.book_volume})` : ""}</p>
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
                  {requests.map((r) => (
                    <div key={r.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="font-medium text-sm">{r.book_title}{r.book_volume ? ` (Vol. ${r.book_volume})` : ""}</p>
                      <p className="text-xs text-muted-foreground mt-1">Code: {r.book_number_code} | Date: {format(new Date(r.request_date), "MMM d, yyyy")}</p>
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
