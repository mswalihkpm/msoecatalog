import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, KeyRound, ShieldCheck } from "lucide-react";
import { lookupStudentPasscode, updateStudent } from "@/lib/store";
import { toast } from "sonner";

interface Props {
  /** Renders as an inline "Forgot passcode?" link if no trigger provided. */
  trigger?: React.ReactNode;
  /** Optional pre-filled name (e.g. from parent context). */
  defaultName?: string;
  /** Called with the recovered passcode when user picks "Continue". */
  onContinue?: (code: string) => void;
}

const formatDob = (v: string) => {
  const digits = v.replace(/\D/g, "").slice(0, 8);
  const p: string[] = [];
  if (digits.length >= 2) { p.push(digits.slice(0, 2)); }
  else { return digits; }
  if (digits.length >= 4) { p.push(digits.slice(2, 4)); }
  else { p.push(digits.slice(2)); return p.join("/"); }
  p.push(digits.slice(4));
  return p.filter(Boolean).join("/");
};

export const ForgotPasscodeDialog = ({ trigger, defaultName, onContinue }: Props) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"verify" | "reveal" | "change">("verify");
  const [name, setName] = useState(defaultName || "");
  const [house, setHouse] = useState("");
  const [father, setFather] = useState("");
  const [dob, setDob] = useState("");
  const [busy, setBusy] = useState(false);
  const [recovered, setRecovered] = useState<{ studentId?: string; code: string } | null>(null);
  const [newCode, setNewCode] = useState("");

  const reset = () => {
    setStep("verify");
    setHouse(""); setFather(""); setDob("");
    setRecovered(null);
    setNewCode("");
  };

  const verify = async () => {
    if (!name.trim() || !house.trim() || !father.trim() || dob.length < 10) {
      toast.error("Fill all fields with correct spelling in CAPITAL letters.");
      return;
    }
    setBusy(true);
    // We need the student id too, so refetch full row via a broader helper — keep it simple:
    const code = await lookupStudentPasscode(name, house, father, dob);
    setBusy(false);
    if (!code) {
      toast.error("No match. Check spelling and date. Contact admin if needed.");
      return;
    }
    // Fetch student id too so we can update code if user picks "Change".
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.from("students").select("id").ilike("name", name.trim()).limit(1).maybeSingle();
      setRecovered({ studentId: (data as any)?.id, code });
    } catch {
      setRecovered({ code });
    }
    setStep("reveal");
  };

  const saveNewCode = async () => {
    if (!/^\d{3}$/.test(newCode)) { toast.error("Enter a 3-digit code"); return; }
    if (!recovered?.studentId) { toast.error("Can't update — contact admin"); return; }
    setBusy(true);
    await updateStudent(recovered.studentId, { code: newCode });
    setBusy(false);
    toast.success("Passcode updated. Use your new code.");
    onContinue?.(newCode);
    setOpen(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button type="button" className="text-xs text-primary hover:underline">
            Forgot passcode?
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" /> Forgot passcode
          </DialogTitle>
        </DialogHeader>

        {step === "verify" && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-xs">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p><strong>Type in CAPITAL letters.</strong></p>
                <p>Keep the correct spelling exactly as it was registered. If you forget these details, contact the admin immediately to edit them.</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input placeholder="e.g. MUHAMMAD FAIZ" value={name} onChange={(e) => setName(e.target.value.toUpperCase())} />
            </div>
            <div className="space-y-1.5">
              <Label>House Name</Label>
              <Input placeholder="e.g. AL AMEEN" value={house} onChange={(e) => setHouse(e.target.value.toUpperCase())} />
            </div>
            <div className="space-y-1.5">
              <Label>Father's Name</Label>
              <Input placeholder="e.g. ABDULLAH" value={father} onChange={(e) => setFather(e.target.value.toUpperCase())} />
            </div>
            <div className="space-y-1.5">
              <Label>Date of Birth (DD/MM/YYYY)</Label>
              <Input placeholder="12/03/2009" value={dob} onChange={(e) => setDob(formatDob(e.target.value))} maxLength={10} />
            </div>
            <DialogFooter>
              <Button onClick={verify} disabled={busy} className="w-full">
                {busy ? "Verifying…" : "Verify"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "reveal" && recovered && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/30 text-center">
              <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified · your passcode is
              </p>
              <Badge className="text-3xl font-mono px-4 py-2 bg-primary text-primary-foreground">
                {recovered.code}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => { onContinue?.(recovered.code); setOpen(false); reset(); }}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Continue with this passcode
              </Button>
              <Button variant="outline" onClick={() => setStep("change")}>Change passcode</Button>
            </div>
          </div>
        )}

        {step === "change" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>New passcode (3 digits)</Label>
              <Input
                placeholder="e.g. 456"
                value={newCode}
                maxLength={3}
                onChange={(e) => setNewCode(e.target.value.replace(/\D/g, "").slice(0, 3))}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("reveal")}>Back</Button>
              <Button onClick={saveNewCode} disabled={busy}>Save new passcode</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
