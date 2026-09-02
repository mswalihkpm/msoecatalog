import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import offlineImage from "@/assets/no-internet.png.asset.json";

interface OfflineScreenProps {
  onRetry?: () => void;
}

export const OfflineScreen = ({ onRetry }: OfflineScreenProps) => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background px-6 text-center">
      <motion.img
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        src={offlineImage.url}
        alt="No internet connection"
        className="w-64 max-w-[80vw] object-contain"
      />
      <h1 className="mt-6 font-serif text-2xl font-bold text-foreground">
        No internet connection
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Please check your internet connection and try again.
      </p>
      <Button
        className="mt-6"
        onClick={() => (onRetry ? onRetry() : window.location.reload())}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Try again
      </Button>
    </div>
  );
};
