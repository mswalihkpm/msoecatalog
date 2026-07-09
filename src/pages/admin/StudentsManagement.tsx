import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { StudentHistoryDialog } from "@/components/StudentHistoryDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Upload, Trash2, Search, Users, Pencil } from "lucide-react";
import { getStudents, addStudent, deleteStudent, updateStudent, bulkAddStudents, bulkDeleteStudents } from "@/lib/store";
import { Student } from "@/lib/types";
import * as XLSX from "xlsx";

const StudentsManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [newStudent, setNewStudent] = useState({ name: "", class: "", code: "", houseName: "", fatherName: "", dateOfBirth: "" });
  const [historyStudent, setHistoryStudent] = useState<string | null>(null);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({ name: "", class: "", code: "", houseName: "", fatherName: "", dateOfBirth: "" });

  // House / Father names must be entered WITHOUT spaces.
  const noSpace = (v: string) => v.replace(/\s+/g, "").toUpperCase();
  const formatDob = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 8);
    if (d.length <= 2) return d;
    if (d.length <= 4) return `${d.slice(0,2)}/${d.slice(2)}`;
    return `${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4)}`;
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    const data = await getStudents();
    setStudents(data);
  };

  const handleAddStudent = async () => {
    if (!newStudent.name.trim() || !newStudent.class.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!newStudent.code.trim() || !/^\d{3}$/.test(newStudent.code)) {
      toast.error("Please enter a valid 3-digit code");
      return;
    }
    if (/\s/.test(newStudent.houseName) || /\s/.test(newStudent.fatherName)) {
      toast.error("House Name and Father's Name must be entered WITHOUT any space");
      return;
    }

    await addStudent({
      name: newStudent.name,
      class: newStudent.class,
      code: newStudent.code,
      houseName: newStudent.houseName || undefined,
      fatherName: newStudent.fatherName || undefined,
      dateOfBirth: newStudent.dateOfBirth || undefined,
    });
    toast.success("Student added successfully");
    setNewStudent({ name: "", class: "", code: "", houseName: "", fatherName: "", dateOfBirth: "" });
    setIsAddDialogOpen(false);
    loadStudents();
  };

  const handleEditStudent = async () => {
    if (!editStudent) return;
    if (!editForm.name.trim() || !editForm.class.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!editForm.code.trim() || !/^\d{3}$/.test(editForm.code)) {
      toast.error("Please enter a valid 3-digit code");
      return;
    }
    if (/\s/.test(editForm.houseName) || /\s/.test(editForm.fatherName)) {
      toast.error("House Name and Father's Name must be entered WITHOUT any space");
      return;
    }

    await updateStudent(editStudent.id, {
      name: editForm.name,
      class: editForm.class,
      code: editForm.code,
      houseName: editForm.houseName || undefined,
      fatherName: editForm.fatherName || undefined,
      dateOfBirth: editForm.dateOfBirth || undefined,
    });
    toast.success("Student updated successfully");
    setEditStudent(null);
    loadStudents();
  };

  const handleDeleteStudent = async (id: string) => {
    await deleteStudent(id);
    toast.success("Student deleted successfully");
    loadStudents();
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const studentsToAdd: Omit<Student, "id" | "createdAt" | "updatedAt">[] = [];

        for (const row of jsonData as Record<string, unknown>[]) {
          const name = String(row["Name"] || row["name"] || row["Student Name"] || row["student_name"] || "").trim();
          const studentClass = String(row["Class"] || row["class"] || row["Student Class"] || row["student_class"] || "").trim();
          const code = String(row["Code"] || row["code"] || row["Secret Code"] || row["secret_code"] || "000").trim();
          const houseName = noSpace(String(row["House"] || row["HouseName"] || row["House Name"] || row["house_name"] || ""));
          const fatherName = noSpace(String(row["Father"] || row["FatherName"] || row["Father Name"] || row["father_name"] || ""));
          const dateOfBirth = formatDob(String(row["DOB"] || row["DateOfBirth"] || row["Date of Birth"] || row["date_of_birth"] || ""));

          if (name && studentClass) {
            studentsToAdd.push({
              name,
              class: studentClass,
              code: /^\d{3}$/.test(code) ? code : "000",
              houseName: houseName || undefined,
              fatherName: fatherName || undefined,
              dateOfBirth: dateOfBirth.length === 10 ? dateOfBirth : undefined,
            });
          }
        }

        if (studentsToAdd.length === 0) {
          toast.error("No valid students found. Ensure columns: Name, Class, Code (House, Father, DOB optional)");
          return;
        }

        await bulkAddStudents(studentsToAdd);
        toast.success(`${studentsToAdd.length} students added successfully`);
        loadStudents();
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        toast.error("Failed to parse Excel file");
      }
    };
    reader.readAsArrayBuffer(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) {
      toast.error("No students selected");
      return;
    }

    const count = await bulkDeleteStudents(selectedStudents);
    toast.success(`${count} students deleted successfully`);
    setSelectedStudents([]);
    loadStudents();
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map((s) => s.id));
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const query = searchQuery.toLowerCase();
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.class.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">Students Management</h1>
          <p className="text-muted-foreground">Manage student list for book requests and reviews</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleBulkUpload}
            accept=".xlsx,.xls"
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
          {selectedStudents.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedStudents.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Selected Students?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {selectedStudents.length} selected students. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Student Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter student name"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  />
                </div>
                 <div className="space-y-2">
                   <Label htmlFor="class">Class</Label>
                   <Input
                     id="class"
                     placeholder="Enter class"
                     value={newStudent.class}
                     onChange={(e) => setNewStudent({ ...newStudent, class: e.target.value })}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="code">Secret Code (3 digits)</Label>
                   <Input
                     id="code"
                     placeholder="e.g. 123"
                     value={newStudent.code}
                     onChange={(e) => {
                       const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                       setNewStudent({ ...newStudent, code: val });
                     }}
                     maxLength={3}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>House Name <span className="text-xs text-muted-foreground">(without space)</span></Label>
                   <Input
                     placeholder="e.g. ALAMEEN"
                     value={newStudent.houseName}
                     onChange={(e) => setNewStudent({ ...newStudent, houseName: noSpace(e.target.value) })}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Father's Name <span className="text-xs text-muted-foreground">(without space)</span></Label>
                   <Input
                     placeholder="e.g. ABDULLAH"
                     value={newStudent.fatherName}
                     onChange={(e) => setNewStudent({ ...newStudent, fatherName: noSpace(e.target.value) })}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Date of Birth (DD/MM/YYYY)</Label>
                   <Input
                     placeholder="12/03/2009"
                     value={newStudent.dateOfBirth}
                     onChange={(e) => setNewStudent({ ...newStudent, dateOfBirth: formatDob(e.target.value) })}
                     maxLength={10}
                   />
                <Button onClick={handleAddStudent} className="w-full">
                  Add Student
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Student Dialog */}
      <Dialog open={!!editStudent} onOpenChange={(open) => { if (!open) setEditStudent(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Student Name</Label>
              <Input
                placeholder="Enter student name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <Input
                placeholder="Enter class"
                value={editForm.class}
                onChange={(e) => setEditForm({ ...editForm, class: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Secret Code (3 digits)</Label>
              <Input
                placeholder="e.g. 123"
                value={editForm.code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                  setEditForm({ ...editForm, code: val });
                }}
                maxLength={3}
              />
            </div>
            <Button onClick={handleEditStudent} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Student List
              </CardTitle>
              <CardDescription>
                {students.length} students registered
              </CardDescription>
            </div>
            <div className="space-y-2">
              <Label>House Name <span className="text-xs text-muted-foreground">(without space)</span></Label>
              <Input
                placeholder="e.g. ALAMEEN"
                value={editForm.houseName}
                onChange={(e) => setEditForm({ ...editForm, houseName: noSpace(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Father's Name <span className="text-xs text-muted-foreground">(without space)</span></Label>
              <Input
                placeholder="e.g. ABDULLAH"
                value={editForm.fatherName}
                onChange={(e) => setEditForm({ ...editForm, fatherName: noSpace(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth (DD/MM/YYYY)</Label>
              <Input
                placeholder="12/03/2009"
                value={editForm.dateOfBirth}
                onChange={(e) => setEditForm({ ...editForm, dateOfBirth: formatDob(e.target.value) })}
                maxLength={10}
              />
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Card className="mb-4 bg-muted/50">
            <CardContent className="py-3">
               <p className="text-sm text-muted-foreground">
                 <strong>Bulk Upload Format:</strong> Excel columns: <Badge variant="secondary">Name</Badge>, <Badge variant="secondary">Class</Badge>, <Badge variant="secondary">Code</Badge> and optionally <Badge variant="secondary">House</Badge>, <Badge variant="secondary">Father</Badge>, <Badge variant="secondary">DOB</Badge> (DD/MM/YYYY). House & Father names must be entered <strong>without space</strong>.
               </p>
            </CardContent>
          </Card>

          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[500px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                   <TableHead>Name</TableHead>
                   <TableHead>Class</TableHead>
                   <TableHead>Code</TableHead>
                   <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No students found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() => toggleSelectStudent(student.id)}
                        />
                      </TableCell>
                     <TableCell className="font-medium">
                       <button
                         onClick={() => setHistoryStudent(student.name)}
                         className="text-left hover:text-primary hover:underline transition-colors cursor-pointer"
                       >
                         {student.name}
                       </button>
                     </TableCell>
                     <TableCell>
                       <Badge variant="secondary">{student.class}</Badge>
                     </TableCell>
                     <TableCell>
                       <Badge variant="outline" className="font-mono">{student.code}</Badge>
                     </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditStudent(student);
                              setEditForm({
                                name: student.name,
                                class: student.class,
                                code: student.code,
                                houseName: student.houseName || "",
                                fatherName: student.fatherName || "",
                                dateOfBirth: student.dateOfBirth || "",
                              });
                            }}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Student?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete {student.name}. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteStudent(student.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <StudentHistoryDialog
        studentName={historyStudent || ""}
        open={!!historyStudent}
        onOpenChange={(open) => { if (!open) setHistoryStudent(null); }}
      />
    </div>
  );
};

export default StudentsManagement;
