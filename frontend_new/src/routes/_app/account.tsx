import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/states";
import { useUpdateProfile } from "@/lib/queries";
import { useAuth } from "@/lib/auth-context";
import { roleLabel } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_app/account")({
  head: () => ({
    meta: [
      { title: "Account Settings — FinSight" },
      {
        name: "description",
        content:
          "Manage your FinSight profile: display name, job title, firm and the role that governs which research and oversight surfaces you can access.",
      },
      { property: "og:title", content: "Account Settings — FinSight" },
      { property: "og:description", content: "Update your profile and review your access role." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, refresh } = useAuth();
  const update = useUpdateProfile();
  const [name, setName] = useState(user?.name ?? "");
  const [title, setTitle] = useState(user?.title ?? "");

  if (!user) return null;

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await update.mutateAsync({ userId: user.id, name: name.trim(), title: title.trim() });
      refresh?.();
      toast.success("Profile updated");
    } catch {
      toast.error("Could not save your profile. Please retry.");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Account settings"
        description="Your identity as it appears on research notes and approval records."
      />

      <form onSubmit={onSubmit} className="surface max-w-xl space-y-4 p-5">
        <div className="space-y-2">
          <Label htmlFor="account-name">Full name</Label>
          <Input
            id="account-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="account-title">Job title</Label>
          <Input
            id="account-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="account-email">Work email</Label>
          <Input id="account-email" value={user.email} readOnly disabled />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline">{roleLabel(user.role)}</Badge>
          <span className="text-muted-foreground">{user.firm}</span>
        </div>
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </>
  );
}
