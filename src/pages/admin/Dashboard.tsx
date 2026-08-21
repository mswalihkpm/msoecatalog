import { LoadingLogo } from "@/components/LoadingLogo";
import { useEffect, useState, useMemo } from "react";
import { BookOpen, Users, Star, Library, FileSpreadsheet, Clock, CheckCircle, XCircle, Search, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getBooks, getBorrowRecords, getReviews, getBookRequests } from "@/lib/store";
import { Book, BookRequest } from "@/lib/types";
import { format, subDays, parseISO, startOfDay } from "date-fns";
import ExcelJS from "exceljs";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    borrowedBooks: 0,
    totalBorrows: 0,
    totalReviews: 0,
    avgRating: 0,
    pendingRequests: 0,
  });
  const [books, setBooks] = useState<Book[]>([]);
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [requestSearch, setRequestSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const loadStats = async () => {
      const [booksData, borrows, reviews, requestsData] = await Promise.all([
        getBooks(),
        getBorrowRecords(),
        getReviews(),
        getBookRequests(),
      ]);

      const avgRating =
        booksData.length > 0
          ? booksData.reduce((sum, b) => sum + b.averageRating, 0) / booksData.length
          : 0;

      setBooks(booksData);
      setRequests(requestsData);
      setStats({
        totalBooks: booksData.length,
        availableBooks: booksData.filter((b) => !b.isBorrowed).length,
        borrowedBooks: booksData.filter((b) => b.isBorrowed).length,
        totalBorrows: borrows.length,
        totalReviews: reviews.length,
        avgRating,
        pendingRequests: requestsData.filter((r) => r.status === "pending").length,
      });
      setIsLoading(false);
    };

    loadStats();
  }, []);

  const requestChartData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = startOfDay(subDays(new Date(), 29 - i));
      return { date, label: format(date, "MMM d"), count: 0 };
    });

    requests.forEach((req) => {
      const reqDate = startOfDay(parseISO(req.requestDate));
      const entry = last30Days.find((d) => d.date.getTime() === reqDate.getTime());
      if (entry) entry.count++;
    });

    return last30Days.map(({ label, count }) => ({ date: label, requests: count }));
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesSearch =
        !requestSearch ||
        request.bookTitle.toLowerCase().includes(requestSearch.toLowerCase()) ||
        request.requesterName.toLowerCase().includes(requestSearch.toLowerCase()) ||
        request.bookNumberCode.toLowerCase().includes(requestSearch.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || request.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, requestSearch, statusFilter]);

  const exportToExcel = async () => {
    if (books.length === 0) {
      toast.error("No books to export");
      return;
    }

    setIsExporting(true);
    toast.info("preparing catalogue export with cover images...");

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Catalogue");

      const headers = [
        "SI No", "Title", "Author", "Category", "Number Code",
        "Volume", "Pages", "Publication", "Description", "Cover Image",
        "Status", "Borrowed By", "Average Rating", "Total Reviews"
      ];

      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true, size: 12 };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };
      headerRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD4A574" } };
        cell.border = {
          top: { style: "thin" }, bottom: { style: "thin" },
          left: { style: "thin" }, right: { style: "thin" },
        };
      });

      // Set column widths
      worksheet.columns = [
        { width: 8 }, { width: 30 }, { width: 20 }, { width: 14 }, { width: 14 },
        { width: 10 }, { width: 8 }, { width: 18 }, { width: 30 }, { width: 18 },
        { width: 12 }, { width: 16 }, { width: 14 }, { width: 13 },
      ];

      // Fetch all cover images in parallel
      const imagePromises = books.map(async (book) => {
        if (!book.coverImage) return null;
        try {
          const response = await fetch(book.coverImage);
          if (!response.ok) return null;
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const ext = book.coverImage.toLowerCase().includes(".png") ? "png" : "jpeg";
          return { buffer: arrayBuffer, ext } as { buffer: ArrayBuffer; ext: "png" | "jpeg" };
        } catch {
          return null;
        }
      });

      const imageResults = await Promise.all(imagePromises);

      for (let i = 0; i < books.length; i++) {
        const book = books[i];
        const rowIndex = i + 2; // +2 because row 1 is header

        const row = worksheet.addRow([
          book.siNumber || i + 1,
          book.title,
          book.author,
          book.category,
          book.numberCode,
          book.volume || "-",
          book.pages || "-",
          book.publication || "-",
          book.description || "-",
          "", // Cover Image column - will add image
          book.isBorrowed ? "Borrowed" : "Available",
          book.borrowedBy || "-",
          book.averageRating.toFixed(1),
          book.totalReviews,
        ]);

        row.alignment = { vertical: "middle", wrapText: true };

        const imgData = imageResults[i];
        if (imgData) {
          const imageId = workbook.addImage({
            buffer: imgData.buffer,
            extension: imgData.ext,
          });
          worksheet.addImage(imageId, {
            tl: { col: 9, row: rowIndex - 1 },
            ext: { width: 80, height: 100 },
          });
          row.height = 80;
        } else {
          row.height = 20;
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `library_catalog_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Catalogue exported with cover images!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export catalogue");
    } finally {
      setIsExporting(false);
    }
  };

  const statCards = [
    {
      title: "Total Books",
      value: stats.totalBooks,
      icon: BookOpen,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Available",
      value: stats.availableBooks,
      icon: Library,
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      title: "Borrowed",
      value: stats.borrowedBooks,
      icon: Users,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      title: "Pending Requests",
      value: stats.pendingRequests,
      icon: Clock,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <LoadingLogo text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Welcome back! Here's an overview of your library.</p>
        </div>
        <Button onClick={exportToExcel} disabled={isExporting} className="gap-2 bg-secondary hover:bg-secondary/90 w-full sm:w-auto">
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <FileSpreadsheet className="h-4 w-4" />
              Export Catalogue
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card
            key={stat.title}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Reviews</span>
              <span className="font-semibold">{stats.totalReviews}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Active Borrows</span>
              <span className="font-semibold">{stats.borrowedBooks}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Availability Rate</span>
              <span className="font-semibold">
                {stats.totalBooks > 0
                  ? ((stats.availableBooks / stats.totalBooks) * 100).toFixed(0)
                  : 0}
                %
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Average Rating</span>
              <span className="font-semibold flex items-center gap-1">
                <Star className="h-4 w-4 text-primary fill-primary" />
                {stats.avgRating.toFixed(1)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>• Use the Books section to add, edit, or delete books</p>
            <p>• Bulk upload books using an Excel file for faster data entry</p>
            <p>• Track all borrow records and requests in the Borrows section</p>
            <p>• Export your entire catalogue to Excel using the button above</p>
            <p>• Change your admin password in Settings</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Book Requests Analysis (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={requestChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  interval={Math.ceil(requestChartData.length / 8)}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="requests" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="font-serif">Book Requests</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or title..."
                  value={requestSearch}
                  onChange={(e) => setRequestSearch(e.target.value)}
                  className="pl-9 w-full sm:w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequests.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {filteredRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{request.bookTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      Code: {request.bookNumberCode} | By: {request.requesterName} ({request.requesterClass})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(request.requestDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="ml-3">
                    {getStatusBadge(request.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {requests.length === 0 ? "No requests yet" : "No requests match your search"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;