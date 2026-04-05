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
import { Moon, Sun, HelpCircle, Mail, Shield } from "lucide-react";

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

          {/* Terms and Conditions */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Terms & Conditions
              </CardTitle>
              <CardDescription>Library usage policies and guidelines</CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <div className="space-y-4 text-sm text-muted-foreground">
                <div>
                  <h4 className="font-semibold text-foreground mb-1">1. Library Membership</h4>
                  <p>Only registered students are eligible to borrow books from the library. Each student must have a valid account with a verified secret code.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">2. Borrowing Rules</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Students may borrow one book at a time.</li>
                    <li>The maximum borrowing period is 20 days from the date of issue.</li>
                    <li>Books must be returned on or before the specified return date.</li>
                    <li>Late returns may result in temporary suspension of borrowing privileges.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">3. Book Care</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Borrowed books must be handled with care and returned in the same condition.</li>
                    <li>Students are responsible for any damage, loss, or defacement of borrowed materials.</li>
                    <li>Writing, highlighting, or marking in library books is strictly prohibited.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">4. Reviews & Ratings</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Students are encouraged to rate and review books to help fellow readers.</li>
                    <li>Reviews must be respectful, honest, and free from inappropriate language.</li>
                    <li>The library reserves the right to remove reviews that violate these guidelines.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">5. Book Requests</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Book requests are subject to approval by the library administration.</li>
                    <li>Requests will be processed on a first-come, first-served basis.</li>
                    <li>The library reserves the right to reject requests based on availability.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">6. Code of Conduct</h4>
                  <p>Students must maintain a quiet and respectful environment in the library. Any misuse of the library system, including sharing secret codes or impersonating other students, may result in account suspension.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">7. Privacy</h4>
                  <p>Student information is stored securely and used solely for library management purposes. Personal data will not be shared with third parties.</p>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground italic">
                    By using this library application, you agree to abide by these terms and conditions. The library administration reserves the right to update these policies at any time.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
