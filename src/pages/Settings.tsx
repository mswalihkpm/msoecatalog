import { Header } from "@/components/Header";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

const Settings = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <Header />
      <main className="container px-4 py-8 max-w-2xl relative z-10">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">About</h1>
          <p className="text-muted-foreground">Imthiyaaz Library Information</p>
        </div>

        <div className="space-y-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                About Imthiyaaz Library
              </CardTitle>
              <CardDescription>
                Library Catalog Management System
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Imthiyaaz Library is your gateway to knowledge and discovery. 
                  Browse our extensive collection of books across various categories including 
                  Islamic literature, novels, biographies, science, and more.
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  You can search for books, read reviews from other readers, and request 
                  books directly through our catalog system.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Version 1.0.0 • Built with ❤️ for Imthiyaaz Library
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
