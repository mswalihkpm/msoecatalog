import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getTheme, setTheme } from "@/lib/store";

const Settings = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const currentTheme = getTheme();
    setIsDarkMode(currentTheme === "dark");
  }, []);

  const handleThemeChange = (checked: boolean) => {
    setIsDarkMode(checked);
    setTheme(checked ? "dark" : "light");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 py-8 max-w-2xl">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Customize your library experience</p>
        </div>

        <div className="space-y-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                Appearance
              </CardTitle>
              <CardDescription>
                Customize how the library catalog looks on your device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="dark-mode" className="font-medium">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={isDarkMode}
                  onCheckedChange={handleThemeChange}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-serif">About</CardTitle>
              <CardDescription>
                Library Catalog Management System
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  This library catalog helps you discover and explore our collection of books. 
                  Browse by category, search for specific titles, and read reviews from other readers.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Version 1.0.0 • Built with ❤️
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
