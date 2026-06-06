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
import { Moon, Sun, HelpCircle, Mail, Shield, MessageCircle, Phone, BookOpen, TrendingUp, Star, Download } from "lucide-react";
import contactPhoto from "@/assets/contact-photo.jpg";
import { getBooks } from "@/lib/store";
import { Book } from "@/lib/types";
import { InstallAppButton } from "@/components/InstallAppButton";

const Settings = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem("theme");
    return stored ? stored === "dark" : false;
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
      question: "How do I search for a book?",
      answer: "Use the search bar on the Catalog page to look up books by title, author, book code, or publication. You can also tap Categories from the bottom navigation to browse by topic or publisher.",
    },
    {
      question: "How do I request a book?",
      answer: "Open the book's detail page and tap 'Request Book'. Enter your name, class, and your personal secret code. The librarian will be notified instantly and you'll be added to the queue.",
    },
    {
      question: "Can I cancel a request I made?",
      answer: "Yes. Open the book you requested and tap 'Cancel Request'. Your pending request will be removed immediately and the next reader in queue moves up.",
    },
    {
      question: "Why is a book cover shaded red?",
      answer: "A red shade means another reader currently has a pending request for that book. If your library settings allow it, you can still queue your own request behind theirs.",
    },
    {
      question: "How are book returns and renewals handled?",
      answer: "Returns and renewals are processed by the librarian in person. Visit the library and ask the admin — they will update your record and set a new return date if a renewal is granted.",
    },
    {
      question: "How can I rate or review a book?",
      answer: "Open any book's detail page. In the Rate tab pick your name and stars (1–5). In the Review tab share a short comment. Your name and class appear next to your review.",
    },
    {
      question: "What is the Store section?",
      answer: "Store contains PDFs, images, videos and spreadsheets uploaded by the admin. You can preview, download, rate and review any item just like a book.",
    },
    {
      question: "How do I talk to the AI assistant?",
      answer: "Tap the glowing ✨ button on the bottom-right of any screen. The AI replies in Malayalam and helps with app guidance, book searches by description, and answers about authors, publishers, categories and ratings.",
    },
    {
      question: "Can I install this as an app on my phone?",
      answer: "Yes. Open Settings → Install App. On Android/Chrome you'll see a one-tap install prompt. On iPhone, use Safari's Share menu → Add to Home Screen.",
    },
    {
      question: "How do I switch between light and dark mode?",
      answer: "Open Settings and use the Appearance toggle. Your theme choice is saved on this device.",
    },
    {
      question: "I forgot or lost my secret code — what do I do?",
      answer: "Visit the librarian in person. Secret codes are issued only by the admin and cannot be reset from inside the app for security reasons.",
    },
    {
      question: "Why can't I see admin options?",
      answer: "The admin panel is private to library staff. Regular users do not have access from the app; admins log in through a separate URL.",
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
          {/* Library Stats */}
          <Card className="bg-card border-border md:hidden">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl bg-card/50 border border-border">
                  <BookOpen className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-xl font-bold text-foreground">{totalBooks}</p>
                  <p className="text-[10px] text-muted-foreground">Total Books</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-card/50 border border-border">
                  <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-xl font-bold text-foreground">{totalAvailable}</p>
                  <p className="text-[10px] text-muted-foreground">Available</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-card/50 border border-border">
                  <Star className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-xl font-bold text-foreground">{topRating.toFixed(1)}</p>
                  <p className="text-[10px] text-muted-foreground">Top Rated</p>
                </div>
              </div>
            </CardContent>
          </Card>

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
                <Switch id="theme-toggle" checked={isDarkMode} onCheckedChange={setIsDarkMode} />
                <Label className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  <span>Dark</span>
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Install App */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Download className="h-5 w-5" />
                Install App
              </CardTitle>
              <CardDescription>Install Imthiyaaz Library on your device for quick access</CardDescription>
            </CardHeader>
            <CardContent>
              <InstallAppButton />
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
                    <AccordionTrigger className="text-sm text-left">{item.question}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">{item.answer}</AccordionContent>
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
                  <h4 className="font-semibold text-foreground mb-1">1. Membership & Identity</h4>
                  <p>The Imthiyaaz Library app is provided exclusively for registered students of the institution. Each student is identified by a unique secret code issued in person by the librarian. Codes are personal — sharing, lending, or impersonating another student's code is strictly forbidden, and you remain fully responsible for every action performed under your name.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">2. Borrowing & Returns</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Books are issued only on the library open dates announced by the admin in the app.</li>
                    <li>The standard borrowing period is 14 days unless the librarian sets a different return date.</li>
                    <li>Books must be returned on or before the date shown in your borrow record.</li>
                    <li>Renewals are at the librarian's discretion and are performed in person; they are not granted automatically.</li>
                    <li>Repeated late returns may lead to temporary suspension of your borrowing privileges.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">3. Book Requests & Queue</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Requests are processed in order on a first-come, first-served basis.</li>
                    <li>You may cancel your own pending request anytime from the book's page.</li>
                    <li>The library may approve, postpone, or reject any request based on availability, your record, and overall fairness.</li>
                    <li>Submitting false or duplicate requests can result in your account being disabled.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">4. Care of Books & Store Items</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Borrowed books and physical materials must be handled with care and returned in the same condition.</li>
                    <li>Writing, highlighting, folding pages, or any defacement is strictly prohibited.</li>
                    <li>Students are liable for the full replacement cost of any damaged, lost, or defaced item.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">5. Store & Digital Resources</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>PDFs, images, videos, and other files in the Store section are provided for personal study only.</li>
                    <li>You may not re-upload, redistribute, sell, or publish these materials outside the app.</li>
                    <li>Respect the copyright of authors and publishers at all times.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">6. Reviews & Ratings</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Reviews must be honest, respectful, and free from hateful, offensive, or off-topic content.</li>
                    <li>Your name and class will appear next to your review.</li>
                    <li>The library may remove any review that violates these guidelines without prior notice.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">7. AI Assistant</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>The Malayalam AI assistant answers only library- and app-related questions (books, authors, publishers, descriptions, categories, ratings, reviews and app guidance).</li>
                    <li>AI responses may occasionally be inaccurate; always verify important information with the librarian.</li>
                    <li>Do not share personal, financial, or sensitive information with the assistant.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">8. Code of Conduct</h4>
                  <p>Maintain a quiet, respectful environment in and around the library. Misuse of the system — including sharing secret codes, impersonating others, submitting false requests, or attempting to access the admin panel — may result in suspension and disciplinary action.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">9. Privacy</h4>
                  <p>Student information (name, class, borrow history, requests, reviews) is stored securely and used only to run the library. We do not sell or share personal data with third parties. Reviews and ratings are visible publicly under the name you submit.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">10. Updates to These Terms</h4>
                  <p>The library administration may update these terms from time to time. Continued use of the app after changes are published implies your acceptance of the updated terms.</p>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground italic">
                    Last updated: June 2026. By using the Imthiyaaz Library app, you agree to abide by these terms and conditions.
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
