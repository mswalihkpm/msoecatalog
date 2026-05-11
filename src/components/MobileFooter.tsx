import { Link, useLocation } from "react-router-dom";
import { Library, FolderTree, Building2, Store as StoreIcon } from "lucide-react";

export const MobileFooter = () => {
  const location = useLocation();
  const isActive = (path: string, search?: string) => {
    if (search) return location.pathname === path && location.search.includes(search);
    return location.pathname === path;
  };

  const items = [
    { to: "/", label: "Catalog", icon: Library, active: location.pathname === "/" },
    { to: "/categories", label: "Categories", icon: FolderTree, active: location.pathname === "/categories" && !location.hash },
    { to: "/categories#publications", label: "Publications", icon: Building2, active: location.hash === "#publications" },
    { to: "/store", label: "Store", icon: StoreIcon, active: location.pathname === "/store" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border">
      <div className="grid grid-cols-4">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link
              key={it.label}
              to={it.to}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors ${
                it.active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
