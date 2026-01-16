import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Search, CheckCircle } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  getBooks,
  getBorrowRecords,
  addBorrowRecord,
  updateBorrowRecord,
  deleteBorrowRecord,
} from "@/lib/store";
import { Book, BorrowRecord } from "@/lib/types";
import { toast } from "sonner";

const BorrowsManagement = () => {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BorrowRecord | null>(null);

  const [formData, setFormData] = useState({
    bookId: "",
    borrowerName: "",
    borrowedDate: "",
    returnDate: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setRecords(getBorrowRecords());
    setBooks(getBooks());
  };

  const availableBooks = books.filter((b) => !b.isBorrowed);

  const resetForm = () => {
    setFormData({
      bookId: "",
      borrowerName: "",
      borrowedDate: "",
      returnDate: "",
    });
    setEditingRecord(null);
  };

  const handleSubmit = () => {
    if (!formData.borrowerName || !formData.borrowedDate || !formData.returnDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingRecord) {
      updateBorrowRecord(editingRecord.id, {
        borrowerName: formData.borrowerName,
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

      addBorrowRecord({
        bookId: formData.bookId,
        bookTitle: book.title,
        borrowerName: formData.borrowerName,
        borrowedDate: formData.borrowedDate,
        returnDate: formData.returnDate,
        isReturned: false,
      });
      toast.success("Borrow record added successfully");
    }

    loadData();
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEditClick = (record: BorrowRecord) => {
    setEditingRecord(record);
    setFormData({
      bookId: record.bookId,
      borrowerName: record.borrowerName,
      borrowedDate: record.borrowedDate,
      returnDate: record.returnDate,
    });
    setIsDialogOpen(true);
  };

  const handleMarkReturned = (id: string) => {
    updateBorrowRecord(id, { isReturned: true });
    toast.success("Book marked as returned");
    loadData();
  };

  const handleDelete = (id: string) => {
    deleteBorrowRecord(id);
    toast.success("Borrow record deleted");
    loadData();
  };

  const filteredRecords = records.filter(
    (record) =>
      record.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.borrowerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Borrows</h1>
          <p className="text-muted-foreground">Manage book borrowing records</p>
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
                            {book.title}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="borrowDate">Borrow Date *</Label>
                  <Input
                    id="borrowDate"
                    type="date"
                    value={formData.borrowedDate}
                    onChange={(e) =>
                      setFormData({ ...formData, borrowedDate: e.target.value })
                    }
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
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book</TableHead>
                <TableHead>Borrower</TableHead>
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
                    <TableCell className="font-medium">{record.bookTitle}</TableCell>
                    <TableCell>{record.borrowerName}</TableCell>
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
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No borrow records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BorrowsManagement;
