import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Edit, Search, CheckCircle, Clock, Check, X, Printer } from "lucide-react";
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
} from "@/lib/store";
import { Book, BorrowRecord, BookRequest } from "@/lib/types";
import { toast } from "sonner";

const BorrowsManagement = () => {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BorrowRecord | null>(null);
  const [approveRequest, setApproveRequest] = useState<BookRequest | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);

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
    await updateBorrowRecord(id, { isReturned: true });
    toast.success("Book marked as returned");
    await loadData();
  };

  const handleDelete = async (id: string) => {
    await deleteBorrowRecord(id);
    toast.success("Borrow record deleted");
    await loadData();
  };

  const handleApproveClick = (request: BookRequest) => {
    setApproveRequest(request);
    setApproveFormData({
      borrowedDate: new Date().toISOString().split("T")[0],
      returnDate: "",
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

  const filteredRecords = records.filter(
    (record) =>
      record.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.borrowerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingRequests = requests.filter((r) => r.status === "pending");

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
                  <Label htmlFor="book">Book *</Label>
                  <Select
                    value={formData.bookId}
                    onValueChange={(value) => setFormData({ ...formData, bookId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a book" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBooks.length > 0 ? (
                        availableBooks.map((book) => (
                          <SelectItem key={book.id} value={book.id}>
                            {book.title} {book.volume ? `(Vol. ${book.volume})` : ""}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No available books
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {editingRecord && (
                <div className="space-y-2">
                  <Label>Book</Label>
                  <Input value={editingRecord.bookTitle} disabled />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="borrower">Borrower Name *</Label>
                <Input
                  id="borrower"
                  value={formData.borrowerName}
                  onChange={(e) => setFormData({ ...formData, borrowerName: e.target.value })}
                />
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
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by book or borrower..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
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
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleMarkReturned(record.id)}
                                className="text-secondary"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
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
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">Book Requests</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                 <TableRow>
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
                    requests.map((request) => (
                      <TableRow key={request.id}>
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
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                  onChange={(e) =>
                    setApproveFormData({ ...approveFormData, borrowedDate: e.target.value })
                  }
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
    </div>
  );
};

export default BorrowsManagement;
