import { useState, useEffect, useRef } from "react";
import { Search, User, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { searchStudents, verifyStudentCode } from "@/lib/store";
import { Student } from "@/lib/types";
import { toast } from "sonner";

interface StudentSearchProps {
  onSelect: (student: Student) => void;
  placeholder?: string;
  selectedStudent?: Student | null;
}

export const StudentSearch = ({ onSelect, placeholder = "Search student...", selectedStudent }: StudentSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Student[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingStudent, setPendingStudent] = useState<Student | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.trim().length < 1) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      const students = await searchStudents(query);
      setResults(students);
      setIsLoading(false);
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (student: Student) => {
    setPendingStudent(student);
    setCodeInput("");
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const handleVerifyCode = async () => {
    if (!pendingStudent) return;
    if (!/^\d{3}$/.test(codeInput)) {
      toast.error("Please enter a valid 3-digit code");
      return;
    }

    setIsVerifying(true);
    const valid = await verifyStudentCode(pendingStudent.id, codeInput);
    setIsVerifying(false);

    if (valid) {
      onSelect(pendingStudent);
      setPendingStudent(null);
      setCodeInput("");
    } else {
      toast.error("Invalid secret code. Please try again.");
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {selectedStudent ? (
        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="font-medium">{selectedStudent.name}</span>
          <Badge variant="secondary" className="ml-auto">{selectedStudent.class}</Badge>
          <button
            type="button"
            onClick={() => onSelect(null as unknown as Student)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Change
          </button>
        </div>
      ) : pendingStudent ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{pendingStudent.name}</span>
            <Badge variant="secondary" className="ml-auto">{pendingStudent.class}</Badge>
            <button
              type="button"
              onClick={() => setPendingStudent(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Change
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Enter 3-digit code"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
              maxLength={3}
              className="flex-1 font-mono text-center text-lg tracking-widest"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleVerifyCode(); } }}
            />
            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={isVerifying || codeInput.length !== 3}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {isVerifying ? "..." : "Verify"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={placeholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="pl-10"
            />
          </div>

          {isOpen && (query.length > 0) && (
            <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-auto shadow-lg">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Searching...
                </div>
              ) : results.length > 0 ? (
                <div className="p-1">
                  {results.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => handleSelect(student)}
                      className="w-full flex items-center gap-3 p-3 rounded hover:bg-muted/50 transition-colors text-left"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{student.name}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">{student.class}</Badge>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No students found. Make sure students are added in admin panel.
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
};
