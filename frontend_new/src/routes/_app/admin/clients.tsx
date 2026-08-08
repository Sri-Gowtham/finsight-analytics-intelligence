import { useState, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { ErrorState, LoadingState, PageHeader } from "@/components/states";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Mail, Phone, Plus, Users, CheckCircle2, UploadCloud, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/clients")({
  component: () => (
    <RoleGuard allow={["admin"]}>
      <ClientManagementPage />
    </RoleGuard>
  ),
});

const STAGE_LABELS: Record<string, string> = {
  created: "Created",
  files_uploaded: "Files Uploaded",
  analysing: "Analysing",
  report_ready: "Report Ready",
  pending_cfo_approval: "Pending CFO Approval",
  approved: "Approved",
};

const STAGE_COLORS: Record<string, string> = {
  created: "bg-muted text-muted-foreground",
  files_uploaded: "bg-blue-100 text-blue-700",
  analysing: "bg-yellow-100 text-yellow-700",
  report_ready: "bg-purple-100 text-purple-700",
  pending_cfo_approval: "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
};

interface Client {
  id: number;
  name: string;
  type: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  assigned_analyst_id: number | null;
  notes: string | null;
  stage: string;
  created_at: string;
  analyst_name?: string;
}

interface User { user_id: number; name: string; role: string; }

function useClients() {
  return useQuery<Client[]>({
    queryKey: ["admin-clients-list"],
    queryFn: async () => {
      const res = await http<{ clients: Client[] }>("/api/admin/clients/list");
      return res.clients;
    },
  });
}

function useAnalysts() {
  return useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await http<{ users: User[] }>("/api/admin/users");
      return res.users.filter((u) => u.role === "Analyst");
    },
  });
}

function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => http<{ client: Client }>("/api/admin/clients", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-clients-list"] }),
  });
}

const BANK_OPTIONS = ["HDFCBANK", "ICICIBANK", "SBIN", "AXISBANK", "KOTAKBANK"];

function AddClientDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const analysts = useAnalysts();
  const create = useCreateClient();
  
  // Basic Details
  const [name, setName] = useState("");
  const [type, setType] = useState("Advisory Firm");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [analystId, setAnalystId] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Financial Details
  const [aum, setAum] = useState("");
  const [investmentMandate, setInvestmentMandate] = useState("");
  const [riskProfile, setRiskProfile] = useState("");
  const [preferredBanks, setPreferredBanks] = useState<string[]>([]);
  const [reportingFrequency, setReportingFrequency] = useState("");
  const [complianceNotes, setComplianceNotes] = useState("");

  // Holdings
  const [holdings, setHoldings] = useState<{ bank: string; units: string; avgPrice: string }[]>([]);

  // Files
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setName(""); setType("Advisory Firm"); setContactName("");
    setContactEmail(""); setContactPhone(""); setAnalystId(""); setNotes("");
    setAum(""); setInvestmentMandate(""); setRiskProfile(""); setPreferredBanks([]);
    setReportingFrequency(""); setComplianceNotes(""); setHoldings([]); setFiles([]);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const addHolding = () => setHoldings(prev => [...prev, { bank: "", units: "", avgPrice: "" }]);
  
  const updateHolding = (index: number, field: string, value: string) => {
    setHoldings(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h));
  };

  const removeHolding = (index: number) => {
    setHoldings(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contactName.trim() || !contactEmail.trim()) {
      toast.error("Name, contact name, and contact email are required.");
      return;
    }
    
    try {
      const payload = {
        name: name.trim(),
        type,
        contact_name: contactName.trim(),
        contact_email: contactEmail.trim(),
        ...(contactPhone.trim() ? { contact_phone: contactPhone.trim() } : {}),
        ...(analystId ? { assigned_analyst_id: Number(analystId) } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        ...(aum ? { aum: Number(aum) } : {}),
        ...(investmentMandate ? { investment_mandate: investmentMandate } : {}),
        ...(riskProfile ? { risk_profile: riskProfile } : {}),
        ...(preferredBanks.length > 0 ? { preferred_banks: preferredBanks } : {}),
        ...(reportingFrequency ? { reporting_frequency: reportingFrequency } : {}),
        ...(complianceNotes.trim() ? { compliance_notes: complianceNotes.trim() } : {}),
        ...(holdings.length > 0 ? { holdings: holdings } : {})
      };

      const res = await create.mutateAsync(payload);
      
      // Upload files if any
      if (files.length > 0) {
        const token = localStorage.getItem("finsight:token");
        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file);
          await fetch(`/api/admin/clients/${res.client.id}/files`, {
            method: "POST",
            headers: token ? { "Authorization": `Bearer ${token}` } : {},
            body: formData
          });
        }
      }
      
      toast.success("Client created successfully");
      reset();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create client");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-8 mt-2">
          
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2">Basic Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="c-name">Client Name *</Label>
                <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Client Type *</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Pension Fund", "Family Office", "Corporate", "Brokerage", "Advisory Firm", "Other"].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Assign Analyst</Label>
                <Select value={analystId} onValueChange={setAnalystId}>
                  <SelectTrigger><SelectValue placeholder="Select analyst..." /></SelectTrigger>
                  <SelectContent>
                    {(analysts.data ?? []).map((a) => (
                      <SelectItem key={a.user_id} value={String(a.user_id)}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Contact Person *</Label>
                <Input value={contactName} onChange={(e) => setContactName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Contact Email *</Label>
                <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Contact Phone</Label>
                <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2">Banking & Financial Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>AUM (in Crores)</Label>
                <Input type="number" value={aum} onChange={(e) => setAum(e.target.value)} placeholder="e.g. 500" />
              </div>
              <div className="space-y-1.5">
                <Label>Investment Mandate</Label>
                <Select value={investmentMandate} onValueChange={setInvestmentMandate}>
                  <SelectTrigger><SelectValue placeholder="Select mandate" /></SelectTrigger>
                  <SelectContent>
                    {["Equity", "Debt", "Hybrid", "Banking Sector", "Multi-Asset"].map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Risk Profile</Label>
                <Select value={riskProfile} onValueChange={setRiskProfile}>
                  <SelectTrigger><SelectValue placeholder="Select risk profile" /></SelectTrigger>
                  <SelectContent>
                    {["Conservative", "Moderate", "Aggressive"].map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Reporting Frequency</Label>
                <Select value={reportingFrequency} onValueChange={setReportingFrequency}>
                  <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                  <SelectContent>
                    {["Weekly", "Monthly", "Quarterly"].map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Preferred Banks</Label>
                <div className="flex flex-wrap gap-4 mt-2">
                  {BANK_OPTIONS.map(bank => (
                    <div key={bank} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`bank-${bank}`} 
                        checked={preferredBanks.includes(bank)}
                        onCheckedChange={(checked) => {
                          if (checked) setPreferredBanks(p => [...p, bank]);
                          else setPreferredBanks(p => p.filter(b => b !== bank));
                        }}
                      />
                      <label htmlFor={`bank-${bank}`} className="text-sm">{bank}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Compliance Requirements</Label>
                <Textarea value={complianceNotes} onChange={(e) => setComplianceNotes(e.target.value)} rows={2} />
              </div>
            </div>
          </div>

          {/* Holdings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-semibold text-sm">Holdings</h3>
              <Button type="button" variant="outline" size="sm" onClick={addHolding} className="h-8 gap-1">
                <Plus className="size-3" /> Add Holding
              </Button>
            </div>
            {holdings.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No holdings added.</p>
            ) : (
              <div className="space-y-3">
                {holdings.map((h, i) => (
                  <div key={i} className="flex items-end gap-3">
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-xs">Bank</Label>
                      <Input placeholder="e.g. HDFCBANK" value={h.bank} onChange={e => updateHolding(i, 'bank', e.target.value)} />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-xs">Units Held</Label>
                      <Input type="number" placeholder="1000" value={h.units} onChange={e => updateHolding(i, 'units', e.target.value)} />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-xs">Avg Buy Price</Label>
                      <Input type="number" placeholder="1500.00" value={h.avgPrice} onChange={e => updateHolding(i, 'avgPrice', e.target.value)} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="mb-0.5 text-destructive" onClick={() => removeHolding(i)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2">Client Files</h3>
            <div 
              onDragOver={e => e.preventDefault()} 
              onDrop={handleFileDrop}
              className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              <UploadCloud className="size-8 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Drag & drop files here</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">PDF, Excel, CSV, Images (Max 10MB)</p>
              <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                Browse Files
              </Button>
              <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => {
                if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
              }} />
            </div>
            {files.length > 0 && (
              <ul className="space-y-2 mt-4">
                {files.map((file, i) => (
                  <li key={i} className="flex items-center justify-between p-2 text-sm border rounded-md bg-card">
                    <span className="truncate max-w-[80%]">{file.name}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(i)}>
                      <X className="size-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>{create.isPending ? "Saving..." : "Create Client"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ClientManagementPage() {
  const clients = useClients();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Client Management"
        description="Manage client firms, their contact information, and analyst assignments."
        actions={
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Add Client
          </Button>
        }
      />

      <AddClientDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />

      {clients.isError ? (
        <ErrorState onRetry={() => void clients.refetch()} />
      ) : clients.isPending ? (
        <LoadingState rows={4} />
      ) : (clients.data ?? []).length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <Users className="size-12 text-muted-foreground/40" />
          <div>
            <p className="font-semibold">No clients yet</p>
            <p className="text-sm text-muted-foreground">Add your first client to get started.</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2"><Plus className="size-4" />Add Client</Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {(clients.data ?? []).map((client) => (
            <Card key={client.id}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-base">{client.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{client.type ?? "Advisory Firm"}</Badge>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[client.stage] ?? "bg-muted text-muted-foreground"}`}>
                        {STAGE_LABELS[client.stage] ?? client.stage}
                      </span>
                    </div>
                  </div>
                  {client.stage === "approved" && <CheckCircle2 className="size-5 text-green-600 shrink-0" />}
                </div>

                <div className="space-y-1.5 text-sm">
                  {client.contact_name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-3.5 w-3.5 shrink-0" /><span>{client.contact_name}</span>
                    </div>
                  )}
                  {client.contact_email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{client.contact_email}</span>
                    </div>
                  )}
                  {client.contact_phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" /><span>{client.contact_phone}</span>
                    </div>
                  )}
                </div>

                {client.notes && (
                  <p className="text-xs text-muted-foreground border-l-2 border-border pl-2">{client.notes}</p>
                )}

                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Assigned Analyst:{" "}
                    <span className="font-medium text-foreground ml-1">
                      {client.analyst_name ?? "Unassigned"}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
