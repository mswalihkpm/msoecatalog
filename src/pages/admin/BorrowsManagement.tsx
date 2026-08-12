import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Edit, Search, CheckCircle, Clock, Check, X, Printer, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getBooks,
  getBorrowRecords,
  addBorrowRecord,
  updateBorrowRecord,
  deleteBorrowRecord,
  getBookRequests,
  updateBookRequest,
  deleteBookRequest,
  updateBook,
} from "@/lib/store";
import { Book, BorrowRecord, BookRequest, Student } from "@/lib/types";
import { toast } from "sonner";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StudentSearch } from "@/components/StudentSearch";

const BorrowsManagement = () => {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "returned">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BorrowRecord | null>(null);
  const [approveRequest, setApproveRequest] = useState<BookRequest | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [printFromNum, setPrintFromNum] = useState("");
  const [printToNum, setPrintToNum] = useState("");
  const [renewRecord, setRenewRecord] = useState<BorrowRecord | null>(null);
  const [renewDays, setRenewDays] = useState<string>("14");
  const [bookPickerOpen, setBookPickerOpen] = useState(false);
  const [selectedBorrower, setSelectedBorrower] = useState<Student | null>(null);

  const [formData, setFormData] = useState({
    bookId: "",
    borrowerName: "",
    borrowerClass: "",
    borrowedDate: "",
    returnDate: "",
  });

  const [approveFormData, setApproveFormData] = useState({
    borrowedDate: "",
    returnDate: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [recordsData, booksData, requestsData] = await Promise.all([
      getBorrowRecords(),
      getBooks(),
      getBookRequests(),
    ]);
    setRecords(recordsData);
    setBooks(booksData);
    setRequests(requestsData);
  };

  const availableBooks = books.filter((b) => !b.isBorrowed);

  const resetForm = () => {
    setFormData({
      bookId: "",
      borrowerName: "",
      borrowerClass: "",
      borrowedDate: "",
      returnDate: "",
    });
    setEditingRecord(null);
    setSelectedBorrower(null);
  };

  const handleSubmit = async () => {
    if (!formData.borrowerName || !formData.borrowedDate || !formData.returnDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingRecord) {
      await updateBorrowRecord(editingRecord.id, {
        borrowerName: formData.borrowerName,
        borrowerClass: formData.borrowerClass,
        borrowedDate: formData.borrowedDate,
        returnDate: formData.returnDate,
      });
      toast.success("Borrow record updated successfully");
    } else {
      if (!formData.bookId) {
        toast.error("Please select a book");
        return;
      }
      const book = books.find((b) => b.id === formData.bookId);
      if (!book) return;

      await addBorrowRecord({
        bookId: formData.bookId,
        bookTitle: book.title,
        bookVolume: book.volume,
        borrowerName: formData.borrowerName,
        borrowerClass: formData.borrowerClass,
        borrowedDate: formData.borrowedDate,
        returnDate: formData.returnDate,
        isReturned: false,
      });
      toast.success("Borrow record added successfully");
    }

    await loadData();
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEditClick = (record: BorrowRecord) => {
    setEditingRecord(record);
    setFormData({
      bookId: record.bookId,
      borrowerName: record.borrowerName,
      borrowerClass: record.borrowerClass || "",
      borrowedDate: record.borrowedDate,
      returnDate: record.returnDate,
    });
    setIsDialogOpen(true);
  };

  const handleMarkReturned = async (id: string) => {
    const record = records.find((r) => r.id === id);
    await updateBorrowRecord(id, { isReturned: true });
    toast.success("Book marked as returned");

    // Auto-approve the next pending request (oldest) for this book, if any.
    if (record) {
      const pending = requests
        .filter((r) => r.bookId === record.bookId && r.status === "pending")
        .sort((a, b) => new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime());
      const next = pending[0];
      if (next) {
        const today = new Date();
        const ret = new Date(today);
        ret.setDate(ret.getDate() + 14);
        const borrowedDate = today.toISOString().split("T")[0];
        const returnDate = next.returnDate || ret.toISOString().split("T")[0];
        await addBorrowRecord({
          bookId: next.bookId,
          bookTitle: next.bookTitle,
          bookVolume: next.bookVolume,
          borrowerName: next.requesterName,
          borrowerClass: next.requesterClass,
          borrowedDate,
          returnDate,
          isReturned: false,
        });
        await updateBookRequest(next.id, { status: "approved" });
        toast.success(`Next request auto-approved: ${next.requesterName}`);
      }
    }
    await loadData();
  };

  const handleRenewSubmit = async () => {
    if (!renewRecord) return;
    const days = parseInt(renewDays, 10);
    if (!days || days <= 0) {
      toast.error("Enter a valid number of days");
      return;
    }
    const newReturn = new Date();
    newReturn.setDate(newReturn.getDate() + days);
    const newReturnStr = newReturn.toISOString().split("T")[0];
    await updateBorrowRecord(renewRecord.id, { returnDate: newReturnStr });
    await updateBook(renewRecord.bookId, { returnDate: newReturnStr });
    toast.success(`Renewed for ${days} days. New return: ${format(newReturn, "MMM d, yyyy")}`);
    setRenewRecord(null);
    setRenewDays("14");
    await loadData();
  };

  const handleDelete = async (id: string) => {
    await deleteBorrowRecord(id);
    toast.success("Borrow record deleted");
    await loadData();
  };

  const handleApproveClick = (request: BookRequest) => {
    setApproveRequest(request);
    const today = new Date();
    const returnDate = new Date(today);
    returnDate.setDate(returnDate.getDate() + 14);
    setApproveFormData({
      borrowedDate: today.toISOString().split("T")[0],
      returnDate: request.returnDate || returnDate.toISOString().split("T")[0],
    });
    setIsApproveDialogOpen(true);
  };

  const handleApproveRequest = async () => {
    if (!approveRequest || !approveFormData.borrowedDate || !approveFormData.returnDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const book = books.find((b) => b.id === approveRequest.bookId);
    if (!book) {
      toast.error("Book not found");
      return;
    }

    await addBorrowRecord({
      bookId: approveRequest.bookId,
      bookTitle: approveRequest.bookTitle,
      bookVolume: approveRequest.bookVolume,
      borrowerName: approveRequest.requesterName,
      borrowerClass: approveRequest.requesterClass,
      borrowedDate: approveFormData.borrowedDate,
      returnDate: approveFormData.returnDate,
      isReturned: false,
    });

    await updateBookRequest(approveRequest.id, { status: "approved" });
    toast.success("Request approved and borrow record created");
    setIsApproveDialogOpen(false);
    setApproveRequest(null);
    await loadData();
  };

  const handleRejectRequest = async (id: string) => {
    await updateBookRequest(id, { status: "rejected" });
    toast.success("Request rejected");
    await loadData();
  };

  const handleDeleteRequest = async (id: string) => {
    await deleteBookRequest(id);
    toast.success("Request deleted");
    await loadData();
  };

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.borrowerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !record.isReturned) ||
      (statusFilter === "returned" && record.isReturned);
    return matchesSearch && matchesStatus;
  });

  // Only show requests that are pending for admin (exclude manager_pending/rejected).
  // Requests for books that are still borrowed stay hidden until the book is returned.
  const isBookBorrowed = (bookId: string) => !!books.find((b) => b.id === bookId)?.isBorrowed;
  const visibleRequests = requests.filter((r) => r.status !== "pending" || !isBookBorrowed(r.bookId));
  const pendingRequests = visibleRequests.filter((r) => r.status === "pending");

  const getBookSiNumber = (bookId: string) => {
    const book = books.find((b) => b.id === bookId);
    return book?.siNumber || "-";
  };

  const handlePrintRequests = () => {
    const from = parseInt(printFromNum) || 1;
    const to = parseInt(printToNum) || requests.length;
    const selectedRequests = requests.slice(from - 1, to);

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Book Requests</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Lora', 'Amiri', serif; font-size: 12px; }
          h1 { text-align: center; font-size: 18px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
          th { background: #f0f0f0; font-weight: bold; }
          .text-center { text-align: center; }
        </style>
      </head>
      <body>
        <h1>Book Requests (${from} - ${to})</h1>
        <table>
          <thead>
            <tr>
              <th class="text-center">#</th>
              <th>SI No.</th>
              <th>Book Code</th>
              <th>Book Name</th>
              <th>Requester</th>
              <th>Return Date</th>
            </tr>
          </thead>
          <tbody>
            ${selectedRequests.map((r, i) => `
              <tr>
                <td class="text-center">${from + i}</td>
                <td>${getBookSiNumber(r.bookId)}</td>
                <td>${r.bookNumberCode}</td>
                <td>${r.bookTitle}${r.bookVolume ? ` (Vol. ${r.bookVolume})` : ""}</td>
                <td>${r.requesterName}</td>
                <td>${r.returnDate ? format(new Date(r.returnDate), "MMM d, yyyy") : "-"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Borrows & Requests</h1>
          <p className="text-muted-foreground">Manage book borrowing records and requests</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 gap-2">
              <Plus className="h-4 w-4" />
              New Borrow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif">
                {editingRecord ? "Edit Borrow Record" : "New Borrow Record"}
              </DialogTitle>
              <DialogDescription>
                {editingRecord
                  ? "Update the borrow details"
                  : "Record a new book borrow"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {!editingRecord && (
                <div className="space-y-2">
                  <Label>Book *</Label>
                  <Popover open={bookPickerOpen} onOpenChange={setBookPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                        {formData.bookId
                          ? (() => {
                              const b = books.find((x) => x.id === formData.bookId);
                              return b ? `${b.title}${b.volume ? ` (Vol. ${b.volume})` : ""}` : "Select a book";
                            })()
                          : "Search book by name..."}
                        <Search className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command
                        filter={(value, search) => {
                          const q = search.trim().toLowerCase();
                          if (!q) return 1;
                          return value.toLowerCase().includes(q) ? 1 : 0;
                        }}
                      >
                        <CommandInput placeholder="Search by title, author, code or SI no..." />
                        <CommandList className="max-h-72">
                          <CommandEmpty>No available book found.</CommandEmpty>
                          <CommandGroup>
                            {availableBooks.map((book) => (
                              <CommandItem
                                key={book.id}
                                value={`${book.title} ${book.author || ""} ${book.numberCode || ""} ${book.siNumber || ""} ${book.volume || ""}`}
                                onSelect={() => {
                                  setFormData({ ...formData, bookId: book.id });
                                  setBookPickerOpen(false);
                                }}
                              >
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="font-medium truncate">{book.title}{book.volume ? ` (Vol. ${book.volume})` : ""}</span>
                                  {book.author && <span className="text-xs text-muted-foreground truncate">{book.author}</span>}
                                </div>
                                <Badge variant="secondary" className="ml-2 font-mono text-[10px] shrink-0">{book.numberCode}</Badge>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>

                    </PopoverContent>
                  </Popover>
                </div>
              )}
              {editingRecord && (
                <div className="space-y-2">
                  <Label>Book</Label>
                  <Input value={editingRecord.bookTitle} disabled />
                </div>
              )}
              <div className="space-y-2">
                <Label>Borrower *</Label>
                {editingRecord ? (
                  <Input
                    value={formData.borrowerName}
                    onChange={(e) => setFormData({ ...formData, borrowerName: e.target.value })}
                  />
                ) : (
                  <StudentSearch
                    skipCodeVerify
                    selectedStudent={selectedBorrower}
                    onSelect={(s) => {
                      setSelectedBorrower(s);
                      setFormData({
                        ...formData,
                        borrowerName: s?.name || "",
                        borrowerClass: s?.class || "",
                      });
                    }}
                    placeholder="Search student by name..."
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="borrowerClass">Class</Label>
                <Input
                  id="borrowerClass"
                  value={formData.borrowerClass}
                  onChange={(e) => setFormData({ ...formData, borrowerClass: e.target.value })}
                  placeholder="e.g., 10A, 9B, Staff"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="borrowDate">Borrow Date *</Label>
                  <Input
                    id="borrowDate"
                    type="date"
                    value={formData.borrowedDate}
                    onChange={(e) => {
                      const newBorrowDate = e.target.value;
                      const returnDate = newBorrowDate ? (() => {
                        const d = new Date(newBorrowDate);
                        d.setDate(d.getDate() + 14);
                        return d.toISOString().split("T")[0];
                      })() : "";
                      setFormData({ ...formData, borrowedDate: newBorrowDate, returnDate });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="returnDate">Return Date *</Label>
                  <Input
                    id="returnDate"
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) =>
                      setFormData({ ...formData, returnDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-gradient-gold text-primary-foreground hover:opacity-90"
              >
                {editingRecord ? "Update" : "Add"} Record
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="borrows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="borrows" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Borrow Records
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <Clock className="h-4 w-4" />
            Requests
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1 px-1.5 py-0.5 text-xs">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="borrows" className="space-y-4">
          {/* Search & Status Filter */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by book or borrower..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | "active" | "returned")}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active (Not Returned)</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Records Table */}
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Borrowed</TableHead>
                    <TableHead>Return By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.bookTitle}
                          {record.bookVolume && <span className="text-muted-foreground text-sm ml-1">(Vol. {record.bookVolume})</span>}
                        </TableCell>
                        <TableCell>{record.borrowerName}</TableCell>
                        <TableCell>{record.borrowerClass || "-"}</TableCell>
                        <TableCell>
                          {format(new Date(record.borrowedDate), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {format(new Date(record.returnDate), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={record.isReturned ? "secondary" : "destructive"}
                            className={record.isReturned ? "bg-secondary text-secondary-foreground" : ""}
                          >
                            {record.isReturned ? "Returned" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!record.isReturned && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleMarkReturned(record.id)}
                                  className="text-secondary"
                                  title="Mark Returned"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => { setRenewRecord(record); setRenewDays("14"); }}
                                  className="text-primary"
                                  title="Renew"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(record)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Record</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this borrow record? This action
                                    cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(record.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No borrow records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {/* Print Controls */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">From #</Label>
              <Input
                type="number"
                min="1"
                value={printFromNum}
                onChange={(e) => setPrintFromNum(e.target.value)}
                placeholder="1"
                className="w-20 h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To #</Label>
              <Input
                type="number"
                min="1"
                value={printToNum}
                onChange={(e) => setPrintToNum(e.target.value)}
                placeholder={String(requests.length)}
                className="w-20 h-9"
              />
            </div>
            <Button onClick={handlePrintRequests} variant="outline" className="gap-2 h-9">
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">Book Requests</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>SI No.</TableHead>
                    <TableHead>Book</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Return Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length > 0 ? (
                    requests.map((request, index) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono text-sm">{index + 1}</TableCell>
                        <TableCell className="font-mono text-sm">{getBookSiNumber(request.bookId)}</TableCell>
                        <TableCell className="font-medium">
                          {request.bookTitle}
                          {request.bookVolume && <span className="text-muted-foreground text-sm ml-1">(Vol. {request.bookVolume})</span>}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-primary">
                          {request.bookNumberCode}
                        </TableCell>
                        <TableCell>{request.requesterName}</TableCell>
                        <TableCell>{request.requesterClass}</TableCell>
                        <TableCell>
                          {format(new Date(request.requestDate), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {request.returnDate ? format(new Date(request.returnDate), "MMM d, yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              request.status === "approved"
                                ? "secondary"
                                : request.status === "rejected"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {request.status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleApproveClick(request)}
                                  className="text-secondary"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRejectRequest(request.id)}
                                  className="text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Request</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this request?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteRequest(request.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No book requests
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve Request Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Approve Request</DialogTitle>
            <DialogDescription>
              Set borrowing details for "{approveRequest?.bookTitle}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Requester</Label>
              <Input value={`${approveRequest?.requesterName} (${approveRequest?.requesterClass})`} disabled />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="approveBorrowDate">Borrow Date *</Label>
                <Input
                  id="approveBorrowDate"
                  type="date"
                  value={approveFormData.borrowedDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    const returnDate = newDate ? (() => {
                      const d = new Date(newDate);
                      d.setDate(d.getDate() + 14);
                      return d.toISOString().split("T")[0];
                    })() : "";
                    setApproveFormData({ borrowedDate: newDate, returnDate });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="approveReturnDate">Return Date *</Label>
                <Input
                  id="approveReturnDate"
                  type="date"
                  value={approveFormData.returnDate}
                  onChange={(e) =>
                    setApproveFormData({ ...approveFormData, returnDate: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApproveRequest}
              className="bg-gradient-gold text-primary-foreground hover:opacity-90"
            >
              Approve & Create Borrow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Renew Dialog */}
      <Dialog open={!!renewRecord} onOpenChange={(open) => !open && setRenewRecord(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Renew Borrow</DialogTitle>
            <DialogDescription>
              Extend the return date for "{renewRecord?.bookTitle}". New return date will be calculated from today.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="renewDays">Next how many days to return? *</Label>
              <Input
                id="renewDays"
                type="number"
                min="1"
                value={renewDays}
                onChange={(e) => setRenewDays(e.target.value)}
                placeholder="e.g., 14"
              />
              {renewDays && parseInt(renewDays, 10) > 0 && (
                <p className="text-xs text-muted-foreground">
                  New return date: <span className="font-semibold text-foreground">
                    {format(new Date(Date.now() + parseInt(renewDays, 10) * 86400000), "MMM d, yyyy")}
                  </span>
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewRecord(null)}>Cancel</Button>
            <Button onClick={handleRenewSubmit} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
              Renew
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BorrowsManagement;
