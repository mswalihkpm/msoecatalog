import { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { updateAdminPassword, getAdminSettings, updateLibraryOpenDate } from "@/lib/store";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import PublicationLogosManager from "@/components/admin/PublicationLogosManager";

const AdminSettings = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [storedPassword, setStoredPassword] = useState("");
  const [libraryOpenDate, setLibraryOpenDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getAdminSettings();
      setStoredPassword(settings.password);
      if (settings.libraryOpenDate) {
        setLibraryOpenDate(new Date(settings.libraryOpenDate + "T00:00:00"));
      }
    };
    loadSettings();
  }, []);

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (currentPassword !== storedPassword) {
      toast.error("Current password is incorrect");
      return;
    }

    if (newPassword.length < 4) {
      toast.error("New password must be at least 4 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    await updateAdminPassword(newPassword);
    setStoredPassword(newPassword);
    toast.success("Password updated successfully");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleOpenDateChange = async (date: Date | undefined) => {
    if (!date) return;
    setLibraryOpenDate(date);
    const dateStr = format(date, "yyyy-MM-dd");
    await updateLibraryOpenDate(dateStr);
    toast.success(`Library open date set to ${format(date, "MMMM d, yyyy")}`);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your admin preferences</p>
      </div>

      {/* Library Open Date */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Library Open Date
          </CardTitle>
          <CardDescription>
            Pick the date when the library will process book borrowing. Return dates will be calculated from this date.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Library Open Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full max-w-xs justify-start text-left font-normal",
                    !libraryOpenDate && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {libraryOpenDate ? format(libraryOpenDate, "MMMM d, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={libraryOpenDate}
                  onSelect={handleOpenDateChange}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {libraryOpenDate && (
              <p className="text-xs text-muted-foreground">
                Currently set to: <span className="font-semibold text-foreground">{format(libraryOpenDate, "EEEE, MMMM d, yyyy")}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Publication Logos */}
      <PublicationLogosManager />

      {/* Change Password */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your admin account password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button
            onClick={handlePasswordChange}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Update Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
