import { useState, useEffect, useRef } from "react";
import { Plus, Upload, Trash2, Edit, Search, Image, X, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { getBooks, addBook, updateBook, deleteBook, bulkAddBooks, bulkDeleteBooks } from "@/lib/store";
import { Book, Category } from "@/lib/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const categories: Category[] = [
  "Islamic",
  "Novel",
  "Biography",
  "Science",
  "English",
  "Arabic",
  "History",
  "General",
  "Poem",
  "Others",
];

const BooksManagement = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bulkDeleteFrom, setBulkDeleteFrom] = useState("");
  const [bulkDeleteTo, setBulkDeleteTo] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    siNumber: "",
    title: "",
    author: "",
    category: "Islamic" as Category,
    numberCode: "",
    description: "",
    coverImage: "",
    volume: "",
    pages: "",
    publication: "",
  });

  const [coverPreview, setCoverPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    const booksData = await getBooks();
    setBooks(booksData);
  };

  const resetForm = () => {
    setFormData({
      siNumber: "",
      title: "",
      author: "",
      category: "Islamic",
      numberCode: "",
      description: "",
      coverImage: "",
      volume: "",
      pages: "",
      publication: "",
    });
    setCoverPreview("");
    setCoverFile(null);
    setEditingBook(null);
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setCoverFile(file);
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setCoverPreview(previewUrl);
  };

  const uploadCoverToStorage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('book-covers')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload image');
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('book-covers')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
      return null;
    }
  };

  const removeCover = () => {
    setFormData({ ...formData, coverImage: "" });
    setCoverPreview("");
    setCoverFile(null);
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  };

  const handleAddBook = async () => {
    if (!formData.siNumber || !formData.title || !formData.author || !formData.numberCode) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsUploading(true);
    
    try {
      let coverImageUrl = formData.coverImage;
      
      // Upload new cover if file is selected
      if (coverFile) {
        const uploadedUrl = await uploadCoverToStorage(coverFile);
        if (uploadedUrl) {
          coverImageUrl = uploadedUrl;
        }
      }

      if (editingBook) {
        await updateBook(editingBook.id, { ...formData, coverImage: coverImageUrl });
        toast.success("Book updated successfully");
      } else {
        await addBook({ ...formData, coverImage: coverImageUrl, isBorrowed: false });
        toast.success("Book added successfully");
      }

      await loadBooks();
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditClick = (book: Book) => {
    setEditingBook(book);
    setFormData({
      siNumber: book.siNumber,
      title: book.title,
      author: book.author,
      category: book.category as Category,
      numberCode: book.numberCode,
      description: book.description || "",
      coverImage: book.coverImage || "",
      volume: book.volume || "",
      pages: book.pages || "",
      publication: book.publication || "",
    });
    setCoverPreview(book.coverImage || "");
    setIsAddDialogOpen(true);
  };

  const handleDeleteBook = async (id: string) => {
    await deleteBook(id);
    toast.success("Book deleted successfully");
    await loadBooks();
  };

  const handleBulkDelete = async () => {
    if (!bulkDeleteFrom || !bulkDeleteTo) {
      toast.error("Please enter both SI numbers");
      return;
    }

    const fromNum = parseInt(bulkDeleteFrom, 10);
    const toNum = parseInt(bulkDeleteTo, 10);

    if (isNaN(fromNum) || isNaN(toNum)) {
      toast.error("Please enter valid numbers");
      return;
    }

    if (fromNum > toNum) {
      toast.error("'From' number should be less than or equal to 'To' number");
      return;
    }

    const deletedCount = await bulkDeleteBooks(bulkDeleteFrom, bulkDeleteTo);
    toast.success(`${deletedCount} books deleted successfully`);
    setBulkDeleteFrom("");
    setBulkDeleteTo("");
    setIsBulkDeleteDialogOpen(false);
    await loadBooks();
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const newBooks = jsonData.map((row: any) => ({
          siNumber: String(row["SI Number"] || row["siNumber"] || ""),
          title: String(row["Title"] || row["Book Name"] || row["title"] || ""),
          author: String(row["Author"] || row["author"] || ""),
          category: String(row["Category"] || row["category"] || "Others") as Category,
          numberCode: String(row["Number Code"] || row["Code"] || row["numberCode"] || ""),
          description: String(row["Description"] || row["description"] || ""),
          volume: String(row["Volume"] || row["volume"] || ""),
          pages: String(row["Pages"] || row["pages"] || ""),
          publication: String(row["Publication"] || row["publication"] || ""),
          isBorrowed: false,
        }));

        const validBooks = newBooks.filter((b) => b.title && b.author);
        if (validBooks.length === 0) {
          toast.error("No valid books found in the file");
          return;
        }

        await bulkAddBooks(validBooks);
        toast.success(`${validBooks.length} books added successfully`);
        await loadBooks();
      } catch (error) {
        toast.error("Error parsing Excel file. Please check the format.");
      }
    };
    reader.readAsArrayBuffer(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.numberCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Books</h1>
          <p className="text-muted-foreground">Manage your library catalog</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx,.xls,.csv"
            onChange={handleBulkUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Bulk Upload
          </Button>
          <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 text-destructive border-destructive">
                <Trash2 className="h-4 w-4" />
                Bulk Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif">Bulk Delete Books</DialogTitle>
                <DialogDescription>
                  Delete books by SI Number range. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromSi">From SI Number</Label>
                  <Input
                    id="fromSi"
                    value={bulkDeleteFrom}
                    onChange={(e) => setBulkDeleteFrom(e.target.value)}
                    placeholder="e.g., 001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toSi">To SI Number</Label>
                  <Input
                    id="toSi"
                    value={bulkDeleteTo}
                    onChange={(e) => setBulkDeleteTo(e.target.value)}
                    placeholder="e.g., 050"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBulkDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleBulkDelete}
                >
                  Delete Books
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 gap-2">
                <Plus className="h-4 w-4" />
                Add Book
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif">
                  {editingBook ? "Edit Book" : "Add New Book"}
                </DialogTitle>
                <DialogDescription>
                  {editingBook ? "Update the book details" : "Fill in the book details to add it to the catalog"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Cover Image Upload */}
                <div className="space-y-2">
                  <Label>Book Cover</Label>
                  <div className="flex items-start gap-4">
                    {coverPreview ? (
                      <div className="relative">
                        <img
                          src={coverPreview}
                          alt="Cover preview"
                          className="w-24 h-32 object-cover rounded-lg border border-border"
                        />
                        <button
                          type="button"
                          onClick={removeCover}
                          className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => coverInputRef.current?.click()}
                        className="w-24 h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                      >
                        <Image className="h-6 w-6 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Upload</span>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={coverInputRef}
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="hidden"
                    />
                    <div className="text-xs text-muted-foreground">
                      <p>Upload a cover image</p>
                      <p>Max size: 2MB</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siNumber">SI Number *</Label>
                    <Input
                      id="siNumber"
                      value={formData.siNumber}
                      onChange={(e) => setFormData({ ...formData, siNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numberCode">Number Code *</Label>
                    <Input
                      id="numberCode"
                      value={formData.numberCode}
                      onChange={(e) => setFormData({ ...formData, numberCode: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value as Category })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="volume">Volume</Label>
                    <Input
                      id="volume"
                      value={formData.volume}
                      onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                      placeholder="e.g., 1, 2"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pages">Pages</Label>
                    <Input
                      id="pages"
                      value={formData.pages}
                      onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                      placeholder="e.g., 256"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="publication">Publication</Label>
                    <Input
                      id="publication"
                      value={formData.publication}
                      onChange={(e) => setFormData({ ...formData, publication: e.target.value })}
                      placeholder="Publisher name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isUploading}>
                  Cancel
                </Button>
                <Button onClick={handleAddBook} className="bg-gradient-gold text-primary-foreground hover:opacity-90" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>{editingBook ? "Update" : "Add"} Book</>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bulk Upload Instructions */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Bulk Upload Format</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Excel columns: SI Number, Title, Author, Category, Number Code, Description, Volume, Pages, Publication
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search books..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Books Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Cover</TableHead>
                <TableHead>SI No.</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vol.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBooks.length > 0 ? (
                filteredBooks.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell>
                      {book.coverImage ? (
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-10 h-14 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                          <Image className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{book.siNumber}</TableCell>
                    <TableCell className="font-medium">{book.title}</TableCell>
                    <TableCell>{book.author}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{book.category}</Badge>
                    </TableCell>
                    <TableCell>{book.volume || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={book.isBorrowed ? "destructive" : "secondary"}
                        className={book.isBorrowed ? "" : "bg-secondary text-secondary-foreground"}
                      >
                        {book.isBorrowed ? "Borrowed" : "Available"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(book)}
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
                              <AlertDialogTitle>Delete Book</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{book.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteBook(book.id)}
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
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No books found
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

export default BooksManagement;
