import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Moon, Sun, HelpCircle, Mail } from "lucide-react";

const Settings = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem("theme");
    return stored ? stored === "dark" : false; // default light
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.remove("light");
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const faqItems = [
    {
      question: "How do I search for books?",
      answer: "Use the search bar on the catalog page to search by title, author, or category. You can also browse by categories."
    },
    {
      question: "How do I request a book?",
      answer: "Go to the book detail page and click the 'Request Book' button. You'll need to select your name and class to complete the request."
    },
    {
      question: "How do I write a review?",
      answer: "Navigate to a book's detail page and scroll down to the reviews section. You can rate the book and leave a comment."
    },
    {
      question: "What if a book is already borrowed?",
      answer: "If a book shows 'Borrowed' status, it is currently with another reader. You can check back later or contact the library."
    },
    {
      question: "I'm having trouble using the app. How can I get help?",
      answer: "For any issues or questions, please reach out to us at mswalihkpm@gmail.com. We're happy to help with any problem you face!"
    },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <Header />
      <main className="container px-4 py-8 max-w-2xl relative z-10">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Customize your experience</p>
        </div>

        <div className="space-y-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          {/* Theme Toggle */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                Appearance
              </CardTitle>
              <CardDescription>Toggle between light and dark mode</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="theme-toggle" className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  <span>Light</span>
                </Label>
                <Switch
                  id="theme-toggle"
                  checked={isDarkMode}
                  onCheckedChange={setIsDarkMode}
                />
                <Label className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  <span>Dark</span>
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>Find answers to common questions</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-sm text-left">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Need more help? Contact us at{" "}
                  <a
                    href="mailto:mswalihkpm@gmail.com"
                    className="text-primary hover:underline font-medium"
                  >
                    mswalihkpm@gmail.com
                  </a>
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
