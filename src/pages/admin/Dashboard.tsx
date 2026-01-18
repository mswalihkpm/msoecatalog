import { useEffect, useState } from "react";
import { BookOpen, Users, Star, Library } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBooks, getBorrowRecords, getReviews } from "@/lib/store";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    borrowedBooks: 0,
    totalBorrows: 0,
    totalReviews: 0,
    avgRating: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      const [books, borrows, reviews] = await Promise.all([
        getBooks(),
        getBorrowRecords(),
        getReviews(),
      ]);

      const avgRating =
        books.length > 0
          ? books.reduce((sum, b) => sum + b.averageRating, 0) / books.length
          : 0;

      setStats({
        totalBooks: books.length,
        availableBooks: books.filter((b) => !b.isBorrowed).length,
        borrowedBooks: books.filter((b) => b.isBorrowed).length,
        totalBorrows: borrows.length,
        totalReviews: reviews.length,
        avgRating,
      });
      setIsLoading(false);
    };

    loadStats();
  }, []);

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
      title: "Avg Rating",
      value: stats.avgRating.toFixed(1),
      icon: Star,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="animate-pulse">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your library.</p>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>• Use the Books section to add, edit, or delete books</p>
            <p>• Bulk upload books using an Excel file for faster data entry</p>
            <p>• Track all borrow records in the Borrows section</p>
            <p>• Change your admin password in Settings</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
