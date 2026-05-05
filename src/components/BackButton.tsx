import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const BackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on home or admin routes (admin has its own layout)
  if (location.pathname === "/" || location.pathname.startsWith("/admin")) return null;

  return (
    <div className="container px-4 pt-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
        className="gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
    </div>
  );
};
