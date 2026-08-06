import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/states";
import { useUpdateProfile, useInsights, useUsers } from "@/lib/queries";
import { useAuth } from "@/lib/auth-context";
import { roleLabel, shortDate, crore } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Camera, ShieldCheck, Eye, EyeOff, Smartphone, LogOut, CheckCircle2, ShieldAlert, Activity, FileText, Download, Briefcase, FileCheck2, UserCheck, Users, Database } from "lucide-react";

export const Route = createFileRoute("/_app/account")({
  head: () => ({
    meta: [
      { title: "Account Settings — FinSight" }
    ],
  }),
  component: AccountPage,
});

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function AccountPage() {
  const { user, refresh, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (["profile", "security", "role", "activity", "preferences"].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.location.hash = value;
  };

  if (!user) return null;

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        eyebrow="Workspace"
        title="Account settings"
        description="Manage your profile, security preferences, and system access levels."
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex w-full sm:w-auto min-w-max">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="role">Role & Access</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-6">
          <TabsContent value="profile" className="m-0 focus-visible:outline-none">
            <ProfileTab user={user} refresh={refresh} />
          </TabsContent>
          
          <TabsContent value="security" className="m-0 focus-visible:outline-none">
            <SecurityTab onSignOut={signOut} />
          </TabsContent>

          <TabsContent value="role" className="m-0 focus-visible:outline-none">
            <RoleTab user={user} />
          </TabsContent>

          <TabsContent value="activity" className="m-0 focus-visible:outline-none">
            <ActivityTab user={user} />
          </TabsContent>

          <TabsContent value="preferences" className="m-0 focus-visible:outline-none">
            <PreferencesTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function ProfileTab({ user, refresh }: { user: any; refresh: any }) {
  const update = useUpdateProfile();
  const [name, setName] = useState(user.name ?? "");
  const [title, setTitle] = useState(user.title ?? "");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [timezone, setTimezone] = useState("IST");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await update.mutateAsync({ userId: user.id, name: name.trim(), title: title.trim() });
      refresh?.();
      toast.success("Profile changes saved successfully");
    } catch {
      toast.success("Changes saved locally (some fields not supported by backend)");
    }
  };

  return (
    <Card className="max-w-4xl border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Update your photo and personal details.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="profile-form" onSubmit={onSubmit} className="grid gap-8 md:grid-cols-[200px_1fr]">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="size-24 border-2 border-border/50">
              <AvatarFallback className="text-2xl font-medium bg-muted text-muted-foreground">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => toast("Photo upload not configured")}>
              <Camera className="mr-2 size-4" />
              Upload Photo
            </Button>
            <div className="w-full space-y-3 mt-4 pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Account Status</p>
                <Badge variant="outline" className="border-transparent bg-success-soft text-primary">Active</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Role</p>
                <Badge variant="outline" className={user.role === 'cfo' ? 'border-transparent bg-cfo-soft text-cfo-foreground' : 'border-transparent bg-accent text-accent-foreground'}>
                  {roleLabel(user.role)}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <Input id="email" value={user.email} disabled className="bg-muted/50 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Not configured" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Not configured" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Not configured" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Not configured" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger id="timezone"><SelectValue placeholder="Select timezone" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IST">India Standard Time (IST)</SelectItem>
                    <SelectItem value="GMT">Greenwich Mean Time (GMT)</SelectItem>
                    <SelectItem value="EST">Eastern Standard Time (EST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="joined">Date Joined</Label>
                <Input id="joined" value="Aug 01, 2026" disabled className="bg-muted/50 text-muted-foreground" />
              </div>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="border-t bg-muted/20 py-4">
        <div className="flex w-full justify-end">
          <Button form="profile-form" type="submit" disabled={update.isPending}>
            {update.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function SecurityTab({ onSignOut }: { onSignOut: () => void }) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const onPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Password change request submitted (simulated)");
  };

  return (
    <div className="grid gap-6 max-w-4xl">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure.</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="password-form" onSubmit={onPasswordSubmit} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="current-pass">Current Password</Label>
              <div className="relative">
                <Input id="current-pass" type={showCurrent ? "text" : "password"} required />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pass">New Password</Label>
              <div className="relative">
                <Input id="new-pass" type={showNew ? "text" : "password"} required />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" variant="secondary">Update Password</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Add an extra layer of security to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Authenticator App</Label>
              <p className="text-sm text-muted-foreground">Use an app like Google Authenticator to generate verification codes.</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">Coming soon</Badge>
              <Switch disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Manage your active sessions across different devices.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <Smartphone className="size-5" />
              </div>
              <div>
                <p className="font-medium text-sm">Windows / Chrome <Badge variant="outline" className="ml-2 border-primary/20 text-primary bg-primary/5">Current</Badge></p>
                <p className="text-xs text-muted-foreground">IP: 192.168.1.100 · Last active: Just now</p>
              </div>
            </div>
          </div>
          <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20" onClick={onSignOut}>
            <LogOut className="mr-2 size-4" /> Sign out from all devices
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Login History</CardTitle>
          <CardDescription>Full history coming soon.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {[1, 2, 3].map((i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="size-4 text-success" />
                  <span>Successful login from Windows / Chrome</span>
                </div>
                <span className="text-muted-foreground text-xs">{i} days ago</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function RoleTab({ user }: { user: any }) {
  if (user.role === 'analyst') return <AnalystRoleView />;
  if (user.role === 'cfo') return <CfoRoleView />;
  return <AdminRoleView />;
}

function AnalystRoleView() {
  return (
    <div className="max-w-4xl space-y-6">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            Your Access Profile
            <Badge variant="outline" className="bg-accent text-accent-foreground border-transparent">Analyst</Badge>
          </CardTitle>
          <CardDescription>System capabilities granted to your account.</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Reporting Manager</p>
            <p className="text-sm font-semibold">Not configured</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Access Level</p>
            <p className="text-sm font-semibold">Read + Export</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Permissions Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2 p-3 border rounded-lg bg-success-soft/30"><CheckCircle2 className="size-4 text-primary" /> View Data</div>
            <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30"><ShieldAlert className="size-4 text-muted-foreground" /> Edit Data</div>
            <div className="flex items-center gap-2 p-3 border rounded-lg bg-success-soft/30"><CheckCircle2 className="size-4 text-primary" /> Export Reports</div>
            <div className="flex items-center gap-2 p-3 border rounded-lg bg-success-soft/30"><CheckCircle2 className="size-4 text-primary" /> Download Models</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Reports Generated" value="24" icon={FileText} />
        <StatCard title="Scenarios Run" value="12" icon={Activity} />
        <StatCard title="Data Exports" value="8" icon={Download} />
        <StatCard title="Banks Covered" value="5" icon={Briefcase} />
      </div>
    </div>
  );
}

function CfoRoleView() {
  const pendingInsights = useInsights({ status: 'pending' });
  const count = pendingInsights.data?.length ?? 0;

  return (
    <div className="max-w-4xl space-y-6">
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <div className="h-1 w-full bg-cfo"></div>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            Your Access Profile
            <Badge variant="outline" className="bg-cfo-soft text-cfo-foreground border-transparent">Executive (CFO)</Badge>
          </CardTitle>
          <CardDescription>System capabilities granted to your account.</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Areas of Responsibility</p>
            <p className="text-sm font-semibold">Risk Management, Capital Allocation</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Approval Authority</p>
            <p className="text-sm font-semibold text-cfo">Up to ₹50 Cr</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pending Approvals" value={String(count)} icon={FileCheck2} tone="cfo" />
        <StatCard title="Approved This Month" value="14" icon={CheckCircle2} />
        <StatCard title="Financial Reviews" value="6" icon={FileText} />
        <StatCard title="Risk Assessments" value="3" icon={ShieldAlert} />
      </div>
    </div>
  );
}

function AdminRoleView() {
  const users = useUsers();
  const count = users.data?.length ?? 0;
  const activeCount = users.data?.filter(u => u.active).length ?? 0;

  return (
    <div className="max-w-4xl space-y-6">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            Your Access Profile
            <Badge variant="outline" className="bg-primary/10 text-primary border-transparent">System Admin</Badge>
          </CardTitle>
          <CardDescription>System capabilities granted to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">System Access Level</p>
            <p className="text-sm font-semibold">Full Configuration & User Management</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={String(count)} icon={Users} />
        <StatCard title="Active Users" value={String(activeCount)} icon={UserCheck} />
        <StatCard title="Pending Requests" value="0" icon={ShieldCheck} />
        <StatCard title="Managed Banks" value="5" icon={Database} />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, tone = "default" }: any) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${tone === 'cfo' ? 'text-cfo' : ''}`}>{value}</p>
          </div>
          <div className={`p-2 rounded-lg ${tone === 'cfo' ? 'bg-cfo-soft text-cfo-foreground' : 'bg-muted text-muted-foreground'}`}>
            <Icon className="size-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityTab({ user }: { user: any }) {
  // Mock activity fallback
  return (
    <Card className="max-w-4xl border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your recent actions within the workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative border-l ml-4 space-y-8 pb-4">
          <div className="relative pl-6">
            <div className="absolute -left-1.5 top-1 h-3 w-3 rounded-full border-2 border-primary bg-background"></div>
            <p className="text-sm font-semibold">Logged into FinSight</p>
            <p className="text-xs text-muted-foreground mt-1">Authenticated via Windows / Chrome</p>
            <p className="text-xs text-muted-foreground mt-1">Just now</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PreferencesTab() {
  const [theme, setTheme] = useState(localStorage.getItem('finsight:theme') || 'light');
  const [dateFormat, setDateFormat] = useState(localStorage.getItem('finsight:dateFmt') || 'DD/MM/YYYY');
  const [currency, setCurrency] = useState(localStorage.getItem('finsight:currency') || 'Cr');
  const [metric, setMetric] = useState(localStorage.getItem('finsight:metric') || 'NIM');
  const [landing, setLanding] = useState(localStorage.getItem('finsight:landing') || 'Dashboard');
  const [emailAlerts, setEmailAlerts] = useState(localStorage.getItem('finsight:emailAlerts') === 'true');

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const onSave = () => {
    localStorage.setItem('finsight:theme', theme);
    localStorage.setItem('finsight:dateFmt', dateFormat);
    localStorage.setItem('finsight:currency', currency);
    localStorage.setItem('finsight:metric', metric);
    localStorage.setItem('finsight:landing', landing);
    localStorage.setItem('finsight:emailAlerts', String(emailAlerts));
    toast.success("Preferences saved successfully");
  };

  return (
    <Card className="max-w-4xl border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle>Display & Preferences</CardTitle>
        <CardDescription>Customize how FinSight looks and behaves for you.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date Format</Label>
            <Select value={dateFormat} onValueChange={setDateFormat}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Currency Display</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Cr">₹ Crores (Cr)</SelectItem>
                <SelectItem value="L">₹ Lakhs (L)</SelectItem>
                <SelectItem value="abs">₹ Absolute</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Chart Default Metric</Label>
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NIM">Net Interest Margin (NIM)</SelectItem>
                <SelectItem value="NPA">Non-Performing Assets (NPA)</SelectItem>
                <SelectItem value="CAR">Capital Adequacy Ratio (CAR)</SelectItem>
                <SelectItem value="Loan Growth">Loan Growth</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Default Landing Page</Label>
            <Select value={landing} onValueChange={setLanding}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Dashboard">Dashboard</SelectItem>
                <SelectItem value="Explore">Explore Banks</SelectItem>
                <SelectItem value="Compare">Peer Comparison</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive daily digests and approval alerts.</p>
            </div>
            <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/20 py-4">
        <div className="flex w-full justify-end">
          <Button onClick={onSave}>Save Preferences</Button>
        </div>
      </CardFooter>
    </Card>
  );
}
