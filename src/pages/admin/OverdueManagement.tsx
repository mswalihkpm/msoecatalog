import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Search, CheckCircle } from "lucide-react";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingLogo } from "@/components/LoadingLogo";
import { getBorrowRecords, updateBorrowRecord } from "@/lib/store";
import type { BorrowRecord } from "@/lib/types";

const safeDate = (value: string) => {
  try {
    return parseISO(value);
  } catch {
    return new Date(value);
  }
};

const OverdueManagement = () => {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    const data = await getBorrowRecords();
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const overdue = useMemo(() => {
    const today = new Date();
    return records
      .filter((r) => !r.isReturned && r.returnDate)
      .map((r) => ({
        ...r,
        daysPast: differenceInCalendarDays(today, safeDate(r.returnDate)),
      }))
      .filter((r) => r.daysPast > 0)
      .sort((a, b) => b.daysPast - a.daysPast);
  }, [records]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return overdue;
    return overdue.filter((r) =>
      [r.borrowerName, r.borrowerClass, r.bookTitle]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    );
  }, [overdue, search]);

  const studentCount = useMemo(
    () => new Set(filtered.map((r) => `${r.borrowerName}|${r.borrowerClass ?? ""}`)).size,
    [filtered]
  );

  const maxDays = filtered.length ? filtered[0].daysPast : 0;

  const severity = (days: number) => {
    if (days > 14) return { label: "Critical", className: "bg-destructive text-destructive-foreground" };
    if (days > 7) return { label: "High", className: "bg-amber-500 text-white" };
    return { label: "Recent", className: "bg-muted text-muted-foreground" };
  };

  const handleMarkReturned = async (id: string) => {
    await updateBorrowRecord(id, { isReturned: true });
    toast.success("Marked as returned");
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingLogo text="Loading overdue records..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          Overdue Books
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Students who have not returned their books by the due date.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Overdue books</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{filtered.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Students involved</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{studentCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Longest overdue</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {maxDays} {maxDays === 1 ? "day" : "days"}
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by student, class or book..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No overdue books. Everything is on time.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Book</TableHead>
                  <TableHead>Borrowed</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead>Days past</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const s = severity(r.daysPast);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.borrowerName}</TableCell>
                      <TableCell>{r.borrowerClass || "-"}</TableCell>
                      <TableCell>
                        {r.bookTitle}
                        {r.bookVolume ? ` (Vol. ${r.bookVolume})` : ""}
                      </TableCell>
                      <TableCell>{format(safeDate(r.borrowedDate), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{format(safeDate(r.returnDate), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <Badge className={s.className}>
                          {r.daysPast} {r.daysPast === 1 ? "day" : "days"} · {s.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => handleMarkReturned(r.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Returned
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((r) => {
              const s = severity(r.daysPast);
              return (
                <Card key={r.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{r.borrowerName}</p>
                        <p className="text-xs text-muted-foreground">{r.borrowerClass || "-"}</p>
                      </div>
                      <Badge className={s.className}>
                        {r.daysPast} {r.daysPast === 1 ? "day" : "days"}
                      </Badge>
                    </div>
                    <p className="text-sm">
                      {r.bookTitle}
                      {r.bookVolume ? ` (Vol. ${r.bookVolume})` : ""}
                    </p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Borrowed: {format(safeDate(r.borrowedDate), "dd/MM/yyyy")}</span>
                      <span>Due: {format(safeDate(r.returnDate), "dd/MM/yyyy")}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleMarkReturned(r.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark returned
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default OverdueManagement;
