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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Moon, Sun, HelpCircle, Mail, Shield, MessageCircle, Phone, BookOpen, TrendingUp, Star } from "lucide-react";
import contactPhoto from "@/assets/contact-photo.jpg";
import { getBooks } from "@/lib/store";
import { Book } from "@/lib/types";

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

  const [books, setBooks] = useState<Book[]>([]);
  useEffect(() => {
    getBooks().then(setBooks).catch(() => {});
  }, []);
  const totalBooks = books.length;
  const totalAvailable = books.filter((b) => !b.isBorrowed).length;
  const topRating = books.reduce((m, b) => (b.averageRating > m ? b.averageRating : m), 0);

  const faqItems = [
    {
      question: "How do I search for books?",
      answer: "Use the search bar on the Catalog page to search by title, author, book code, or publisher. You can also Browse by Category or Publication House from the bottom navigation."
    },
    {
      question: "How do I request a book?",
      answer: "Open a book's detail page and tap 'Request Book'. Enter your name, class, and your secret code to confirm the request. The librarian will be notified."
    },
    {
      question: "Can I cancel a request I've already made?",
      answer: "Yes. Open the book you requested and tap 'Cancel Request'. This removes your pending request immediately."
    },
    {
      question: "Why does a book cover show a red shading?",
      answer: "A red shade on a cover means another reader currently has a pending request for that book. You can still queue your own request if allowed."
    },
    {
      question: "How do I renew a borrowed book?",
      answer: "Renewals are handled by the librarian. Visit the library and ask the admin to renew — they will set a new return date for you."
    },
    {
      question: "How do I write or read reviews?",
      answer: "Open any book's detail page and scroll to the reviews section. You can rate from 1–5 stars and leave a short comment."
    },
    {
      question: "What if a book is already borrowed?",
      answer: "If a book shows 'Borrowed', it's currently with another reader. You can still request it — your request will be processed once it returns."
    },
    {
      question: "Where can I see books from a specific publisher?",
      answer: "Tap 'Publications' in the bottom footer, or open Categories and pick the Publications card. Each publisher's books are grouped together."
    },
    {
      question: "How do I switch between light and dark mode?",
      answer: "Open Settings from the bottom footer and use the Appearance toggle to switch themes. Your choice is remembered on this device."
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

            </CardContent>
          </Card>

          {/* Contact Us */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Contact Us
              </CardTitle>
              <CardDescription>Reach out for support or queries</CardDescription>
            </CardHeader>
            <CardContent>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Mail className="h-4 w-4" /> Open Contact Details
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[320px] sm:w-[380px]">
                  <SheetHeader className="text-left">
                    <SheetTitle className="font-serif">Get in touch</SheetTitle>
                    <SheetDescription>We're happy to help with any questions.</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 flex flex-col items-center gap-4">
                    <div className="h-20 w-20 overflow-hidden rounded-md border-2 border-primary/30 shadow-sm">
                      <img src={contactPhoto} alt="Support contact" className="h-full w-full object-cover" />
                    </div>
                    <p className="text-sm text-muted-foreground">Support Representative</p>
                  </div>
                  <div className="mt-6 space-y-3">
                    <a
                      href="mailto:mswalihkpm@gmail.com"
                      className="flex items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/50 hover:bg-accent transition-all"
                    >
                      <div className="p-2 rounded-md bg-primary/10 text-primary">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium text-foreground truncate">mswalihkpm@gmail.com</p>
                      </div>
                    </a>
                    <a
                      href="tel:+919037339492"
                      className="flex items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/50 hover:bg-accent transition-all"
                    >
                      <div className="p-2 rounded-md bg-primary/10 text-primary">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium text-foreground">+91 9037339492</p>
                      </div>
                    </a>
                  </div>
                </SheetContent>
              </Sheet>
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
                  <p>Only registered students of Imthiyaaz Library may borrow books. Each student is identified by a unique secret code issued by the librarian. Sharing your code with others is strictly forbidden — you are responsible for any activity made under your name.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">2. Borrowing & Return</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Books are issued only on the announced library open date set by the admin.</li>
                    <li>The default borrowing period is 14 days unless otherwise specified.</li>
                    <li>Books must be returned on or before the return date shown in your borrow record.</li>
                    <li>Renewals are at the librarian's discretion and may be granted in person.</li>
                    <li>Repeated late returns may result in temporary suspension of borrowing privileges.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">3. Book Requests</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>You may submit a request through the app for any available or borrowed book.</li>
                    <li>Requests are processed in order on a first-come, first-served basis.</li>
                    <li>You may cancel your own pending request at any time from the book's page.</li>
                    <li>The library reserves the right to approve or reject any request based on availability and student record.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">4. Care of Books</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Borrowed books must be handled with care and returned in the same condition.</li>
                    <li>Writing, highlighting, folding pages, or marking inside library books is strictly prohibited.</li>
                    <li>Students are responsible for the full cost of any damage, loss, or defacement of borrowed materials.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">5. Reviews & Ratings</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Students are encouraged to rate and review books to help fellow readers.</li>
                    <li>Reviews must be respectful, honest, and free from inappropriate or hateful language.</li>
                    <li>The library may remove any review that violates these guidelines without prior notice.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">6. Code of Conduct</h4>
                  <p>Maintain a quiet and respectful environment in and around the library. Misuse of the library system — including sharing secret codes, impersonating other students, or submitting false requests — may result in account suspension and disciplinary action.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">7. Privacy</h4>
                  <p>Student information (name, class, borrowing history) is stored securely and used only for library management. We do not share personal data with third parties. Reviews are visible publicly under the name you submit.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">8. Changes to These Terms</h4>
                  <p>The library administration may update these terms at any time. Continued use of the app after changes implies your acceptance of the updated terms.</p>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground italic">
                    Last updated: May 2026. By using the Imthiyaaz Library app, you agree to abide by these terms and conditions.
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
