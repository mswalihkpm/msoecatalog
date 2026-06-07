import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const INITIAL_MSG: Msg = {
  role: "assistant",
  content:
    "അസ്സലാമു അലൈക്കും! 👋 ഞാൻ Imthiyaaz Library സഹായിയാണ്. പുസ്തകങ്ങൾ, ആപ്പ് ഉപയോഗം, വിവരണപ്രകാരം പുസ്തക ശുപാർശ — എന്തും ചോദിക്കാം.",
};

export const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([INITIAL_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset chat each time the panel is opened
  useEffect(() => {
    if (open) {
      setMessages([INITIAL_MSG]);
      setInput("");
      setLoading(false);
    }
  }, [open]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("library-ai", {
        body: { messages: next.map((m) => ({ role: m.role, content: m.content })) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (e: any) {
      toast.error(e.message || "AI പിശക്");
      setMessages((m) => [...m, { role: "assistant", content: "ക്ഷമിക്കണം, ഇപ്പോൾ ഉത്തരം നൽകാൻ കഴിയുന്നില്ല." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        aria-label="AI Assistant"
        onClick={() => setOpen(true)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1, rotate: 10 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="fixed z-[60] right-4 bottom-20 md:bottom-6 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-2xl ring-2 ring-primary/30 flex items-center justify-center"
      >
        <motion.span
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-primary/40 blur-md -z-10"
        />
        <Sparkles className="h-6 w-6" />
      </motion.button>

      {/* Side panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              key="panel"
              initial={{ x: "100%", opacity: 0, rotateY: 25 }}
              animate={{ x: 0, opacity: 1, rotateY: 0 }}
              exit={{ x: "100%", opacity: 0, rotateY: 20 }}
              transition={{ type: "spring", stiffness: 220, damping: 26 }}
              style={{ transformOrigin: "right center" }}
              className="fixed z-[80] right-0 top-0 h-full w-full sm:w-[420px] bg-card border-l border-border shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Library AI</p>
                    <p className="text-[10px] text-muted-foreground">മലയാളത്തിൽ ചോദിക്കാം</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "ml-auto bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    }`}
                    style={{ fontFamily: m.role === "assistant" ? "'Noto Sans Malayalam', 'Lora', serif" : undefined }}
                  >
                    {m.content}
                  </motion.div>
                ))}
                {loading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> ചിന്തിക്കുന്നു...
                  </div>
                )}
              </div>

              <form
                onSubmit={(e) => { e.preventDefault(); send(); }}
                className="p-3 border-t border-border flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="നിങ്ങളുടെ ചോദ്യം..."
                  disabled={loading}
                />
                <Button type="submit" size="icon" disabled={loading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
