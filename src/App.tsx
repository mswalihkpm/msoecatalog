import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { initializeData } from "@/lib/store";
import { SplashScreen } from "@/components/SplashScreen";
import { MobileFooter } from "@/components/MobileFooter";
import { BackButton } from "@/components/BackButton";

import Catalog from "./pages/Catalog";
import BookDetail from "./pages/BookDetail";
import Settings from "./pages/Settings";
import Categories from "./pages/Categories";
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import BooksManagement from "./pages/admin/BooksManagement";
import BorrowsManagement from "./pages/admin/BorrowsManagement";
import StudentsManagement from "./pages/admin/StudentsManagement";
import ReviewsManagement from "./pages/admin/ReviewsManagement";
import AdminSettings from "./pages/admin/AdminSettings";
import PostersManagement from "./pages/admin/PostersManagement";
import StoreManagement from "./pages/admin/StoreManagement";
import ManagerLogin from "./pages/ManagerLogin";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import Store from "./pages/Store";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    initializeData();
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <>
      <BackButton />
      <div className="pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/book/:id" element={<BookDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/store" element={<Store />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="books" element={<BooksManagement />} />
            <Route path="students" element={<StudentsManagement />} />
            <Route path="reviews" element={<ReviewsManagement />} />
            <Route path="borrows" element={<BorrowsManagement />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="posters" element={<PostersManagement />} />
            <Route path="store" element={<StoreManagement />} />
          </Route>
          <Route path="/manager" element={<ManagerLogin />} />
          <Route path="/manager/dashboard" element={<ManagerDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <MobileFooter />
      
    </>
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
