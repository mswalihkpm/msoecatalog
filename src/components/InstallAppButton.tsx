import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Smartphone } from "lucide-react";
import { toast } from "sonner";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export const InstallAppButton = () => {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-ignore - iOS Safari
      window.navigator.standalone === true;
    setInstalled(standalone);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      toast.success("App installed!");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        toast.success("Installing...");
      }
      setDeferred(null);
      return;
    }
    if (isIOS) {
      setShowIOS(true);
      return;
    }
    toast.info("Use your browser menu → 'Install app' or 'Add to Home Screen'.");
  };

  if (installed) {
    return (
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Smartphone className="h-4 w-4 text-primary" /> App is already installed on this device.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Button onClick={install} className="w-full gap-2">
        <Download className="h-4 w-4" /> Install App
      </Button>
      {showIOS && (
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md space-y-1">
          <p className="font-semibold text-foreground">On iPhone / iPad (Safari):</p>
          <ol className="list-decimal pl-4 space-y-0.5">
            <li>Tap the Share button (square with arrow).</li>
            <li>Scroll and choose <b>Add to Home Screen</b>.</li>
            <li>Tap <b>Add</b> in the top corner.</li>
          </ol>
        </div>
      )}
    </div>
  );
};
