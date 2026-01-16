import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { getTheme, initializeData } from "@/lib/store";
import Catalog from "./pages/Catalog";
import BookDetail from "./pages/BookDetail";
import Settings from "./pages/Settings";
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import BooksManagement from "./pages/admin/BooksManagement";
import BorrowsManagement from "./pages/admin/BorrowsManagement";
import AdminSettings from "./pages/admin/AdminSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  useEffect(() => {
    // Initialize data and theme
    initializeData();
    const theme = getTheme();
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Catalog />} />
      <Route path="/book/:id" element={<BookDetail />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="books" element={<BooksManagement />} />
        <Route path="borrows" element={<BorrowsManagement />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
