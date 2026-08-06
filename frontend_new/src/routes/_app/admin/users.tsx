import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { ErrorState, LoadingState, PageHeader } from "@/components/states";
import { useSetUserActive, useUsers, useProvisionUser } from "@/lib/queries";
import { dateTime, roleLabel } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/_app/admin/users")({
  head: () => ({
    meta: [
      { title: "User Management — FinSight" },
      {
        name: "description",
        content:
          "Administer analyst, CFO and admin accounts across the firm: review roles, titles and activation status for platform access control.",
      },
      { property: "og:title", content: "User Management — FinSight" },
      { property: "og:description", content: "Manage firm access, roles and activation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RoleGuard allow={["admin"]}>
      <UsersPage />
    </RoleGuard>
  ),
});

function UsersPage() {
  const users = useUsers();
  const setActive = useSetUserActive();

  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeader
          eyebrow="Administration"
          title="User management"
          description="Control who can reach research, oversight and administration surfaces."
        />
        <CreateUserModal />
      </div>
      
      {users.isError ? (
        <ErrorState onRetry={() => void users.refetch()} />
      ) : users.isPending ? (
        <LoadingState rows={4} />
      ) : (
        <ul className="space-y-3">
          {(users.data ?? []).map((u) => (
            <li key={u.id} className="surface flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <p className="font-semibold">{u.name}</p>
                <p className="text-xs text-muted-foreground">
                  {u.email} · {u.title || "No Title"} · joined {dateTime(u.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">{roleLabel(u.role)}</Badge>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {u.active ? "Active" : "Disabled"}
                  </span>
                  <Switch
                    checked={u.active}
                    aria-label={`Toggle access for ${u.name}`}
                    onCheckedChange={(checked) =>
                      setActive.mutate(
                        { userId: u.id, active: checked },
                        {
                          onSuccess: () => {
                            toast.success(checked ? "User activated" : "User deactivated");
                          },
                          onError: () => {
                            toast.error("Failed to update user status");
                          }
                        }
                      )
                    }
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function CreateUserModal() {
  const [open, setOpen] = useState(false);
  const provisionUser = useProvisionUser();
  const [showPassword, setShowPassword] = useState(false);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("analyst");
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let p = "";
    for (let i = 0; i < 12; i++) {
      p += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(p);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || password.length < 8) {
      toast.error("Please fill in required fields correctly.");
      return;
    }
    
    provisionUser.mutate(
      { name, email, role, title, password },
      {
        onSuccess: () => {
          toast.success(`User created and credentials sent to ${email}`);
          setOpen(false);
          // reset
          setName("");
          setEmail("");
          setRole("analyst");
          setTitle("");
          setDepartment("");
          setPhone("");
          setPassword("");
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to create user");
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create new user</DialogTitle>
            <DialogDescription>
              Add a new team member and send them login credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Work Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={role} onValueChange={(val: any) => setRole(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="cfo">CFO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Temporary Password *</Label>
                <button type="button" onClick={generatePassword} className="text-xs text-primary hover:underline">
                  Auto-generate
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={provisionUser.isPending}>
              {provisionUser.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
