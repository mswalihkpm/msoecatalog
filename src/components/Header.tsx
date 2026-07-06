import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Settings, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logo from "@/assets/logo.png";

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: "/", label: "Catalogue" },
    { path: "/categories", label: "Categories" },
    { path: "/store", label: "Store" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 select-none min-w-0">
          <img src={logo} alt="Library Logo" className="h-8 w-8 sm:h-10 sm:w-10 object-contain flex-shrink-0" />
          <span className="text-base sm:text-xl font-bold text-foreground truncate" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Imthiyaaz Library
          </span>
        </Link>

        {/* Mobile leaderboard quick action */}
        <Link to="/leaderboard" className="md:hidden ml-auto mr-1">
          <Button variant="ghost" size="icon" title="Leaderboard">
            <Trophy className="h-5 w-5" />
          </Button>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive(link.path) ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link to="/leaderboard">
            <Button variant="ghost" size="icon" title="Leaderboard">
              <Trophy className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/settings">
            <Button variant="ghost" size="icon" title="Settings">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </nav>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <nav className="flex flex-col gap-4 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`text-lg font-medium transition-colors hover:text-primary ${
                    isActive(link.path) ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link to="/settings" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" size="icon" title="Settings">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

