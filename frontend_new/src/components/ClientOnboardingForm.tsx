import { useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { UploadCloud, Trash2, File as FileIcon, FileText, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useUsers } from "@/lib/queries";

// Sub-components for Form Layout
const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-primary">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {children}
    </div>
  </div>
);

const FullWidth = ({ children }: { children: React.ReactNode }) => (
  <div className="md:col-span-2 lg:col-span-3">{children}</div>
);

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(type: string) {
  if (type.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
  if (type.includes("sheet") || type.includes("excel") || type.includes("csv")) return <FileText className="h-5 w-5 text-green-500" />;
  if (type.includes("image")) return <ImageIcon className="h-5 w-5 text-blue-500" />;
  return <FileIcon className="h-5 w-5 text-muted-foreground" />;
}

const HOLDINGS_OPTIONS = [
  "HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak", 
  "IndusInd", "AU Small Finance", "Federal Bank", "IDFC First"
];

const REQUIRED_DOCS = [
  "Client KYC", "PAN Card", "GST Certificate", "CIN Certificate", 
  "Board Resolution", "Financial Statements (Balance Sheet, P&L, Cash Flow)", 
  "Annual Report", "Quarterly Report", "Bank Statements", "Credit Rating Report", 
  "Portfolio Holdings (Excel)", "Loan Documents (Sanction Letter)", "Collateral Documents", 
  "Insurance Details", "Tax Returns", "Audit Report", "Compliance Documents", 
  "RBI/NBFC License (if applicable)", "Shareholding Pattern", "Organization Structure", 
  "Management Details", "Supporting Documents"
];

export function ClientOnboardingForm({ onCancel, onSuccess }: { onCancel: () => void, onSuccess: () => void }) {
  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<any>({
    defaultValues: { holdings: [] }
  });
  
  const users = useUsers();
  const analysts = (users.data ?? []).filter(u => u.role === "analyst");
  const cfos = (users.data ?? []).filter(u => u.role === "cfo");

  const [files, setFiles] = useState<{file: File, date: Date}[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onSubmit = (data: any) => {
    console.log("Onboarding Data:", data);
    console.log("Attached Files:", files);
    toast.success("Client onboarded successfully (Mock)");
    onSuccess();
  };

  const onSaveDraft = () => {
    toast.info("Draft saved successfully.");
    onCancel();
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    const valid = newFiles.filter(f => f.size <= 25 * 1024 * 1024);
    if (valid.length < newFiles.length) toast.warning("Some files exceeded 25MB limit and were skipped.");
    setFiles(prev => [...prev, ...valid.map(f => ({ file: f, date: new Date() }))]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* SECTION 1: CLIENT INFORMATION */}
      <Section title="1. Client Information">
        <div className="space-y-2">
          <Label>Client Name *</Label>
          <Input {...register("clientName", { required: true })} className={errors.clientName ? "border-red-500" : ""} />
        </div>
        <div className="space-y-2">
          <Label>Client Type *</Label>
          <Controller name="clientType" control={control} rules={{ required: true }} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className={errors.clientType ? "border-red-500" : ""}><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {["Individual", "Corporate", "SME", "NBFC", "Bank", "Financial Institution", "Government", "Trust", "Partnership", "Startup"].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
        </div>
        <div className="space-y-2"><Label>Industry</Label><Input {...register("industry")} /></div>
        <div className="space-y-2"><Label>Company Registration Number</Label><Input {...register("regNumber")} /></div>
        <div className="space-y-2"><Label>GST Number</Label><Input {...register("gstNumber")} /></div>
        <div className="space-y-2"><Label>PAN Number</Label><Input {...register("panNumber")} /></div>
        <div className="space-y-2"><Label>CIN Number</Label><Input {...register("cinNumber")} /></div>
        <div className="space-y-2"><Label>Website</Label><Input type="url" {...register("website")} /></div>
        
        <FullWidth>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="space-y-2 md:col-span-2"><Label>Head Office Address</Label><Input {...register("address")} /></div>
            <div className="space-y-2"><Label>City</Label><Input {...register("city")} /></div>
            <div className="space-y-2"><Label>State</Label><Input {...register("state")} /></div>
            <div className="space-y-2"><Label>Postal Code</Label><Input {...register("postalCode")} /></div>
          </div>
        </FullWidth>
        <div className="space-y-2"><Label>Country</Label><Input {...register("country")} /></div>
      </Section>

      {/* SECTION 2: PRIMARY CONTACT */}
      <Section title="2. Primary Contact">
        <div className="space-y-2">
          <Label>Contact Person Name *</Label>
          <Input {...register("contactName", { required: true })} className={errors.contactName ? "border-red-500" : ""} />
        </div>
        <div className="space-y-2"><Label>Designation</Label><Input {...register("contactDesignation")} /></div>
        <div className="space-y-2"><Label>Department</Label><Input {...register("contactDepartment")} /></div>
        <div className="space-y-2">
          <Label>Official Email *</Label>
          <Input type="email" {...register("contactEmail", { required: true })} className={errors.contactEmail ? "border-red-500" : ""} />
        </div>
        <div className="space-y-2"><Label>Phone Number</Label><Input {...register("contactPhone")} /></div>
        <div className="space-y-2"><Label>Alternative Contact</Label><Input {...register("contactAltPhone")} /></div>
        <div className="space-y-2"><Label>LinkedIn Profile</Label><Input type="url" {...register("contactLinkedin")} /></div>
      </Section>

      {/* SECTION 3: RELATIONSHIP DETAILS */}
      <Section title="3. Relationship Details">
        <div className="space-y-2">
          <Label>Relationship Manager (Analyst) *</Label>
          <Controller name="analystId" control={control} rules={{ required: true }} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className={errors.analystId ? "border-red-500" : ""}><SelectValue placeholder="Assign Analyst" /></SelectTrigger>
              <SelectContent>
                {analysts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
        </div>
        <div className="space-y-2">
          <Label>Assign CFO</Label>
          <Controller name="cfoId" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue placeholder="Assign CFO" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {cfos.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
        </div>
        <div className="space-y-2">
          <Label>Client Status *</Label>
          <Controller name="clientStatus" control={control} rules={{ required: true }} defaultValue="Onboarding" render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className={errors.clientStatus ? "border-red-500" : ""}><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Prospect", "Onboarding", "Active", "Dormant", "Closed"].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
        </div>
        <div className="space-y-2">
          <Label>Priority</Label>
          <Controller name="priority" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent>
            </Select>
          )} />
        </div>
        <div className="space-y-2">
          <Label>Risk Category</Label>
          <Controller name="riskCategory" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem></SelectContent>
            </Select>
          )} />
        </div>
        <div className="space-y-2"><Label>Expected Annual Revenue</Label><Input type="number" {...register("expectedRevenue")} /></div>
        <div className="space-y-2"><Label>Contract Start Date</Label><Input type="date" {...register("contractStart")} /></div>
        <div className="space-y-2"><Label>Renewal Date</Label><Input type="date" {...register("contractRenewal")} /></div>
      </Section>

      {/* SECTION 4: BANKING INFORMATION */}
      <Section title="4. Banking Information">
        <div className="space-y-2"><Label>Primary Banking Partner</Label><Input {...register("bankPrimary")} /></div>
        <div className="space-y-2"><Label>Current Bank</Label><Input {...register("bankCurrent")} /></div>
        <div className="space-y-2"><Label>Branch</Label><Input {...register("bankBranch")} /></div>
        <div className="space-y-2"><Label>IFSC Code</Label><Input {...register("bankIfsc")} /></div>
        <div className="space-y-2"><Label>SWIFT Code</Label><Input {...register("bankSwift")} /></div>
        <div className="space-y-2"><Label>Account Number</Label><Input type="password" {...register("bankAccount")} /></div>
        <div className="space-y-2"><Label>Account Type</Label><Input {...register("bankAccType")} /></div>
        <div className="space-y-2"><Label>Currency</Label><Input {...register("bankCurrency")} defaultValue="INR" /></div>
        <div className="space-y-2"><Label>Credit Rating</Label><Input {...register("bankCreditRating")} /></div>
        <div className="space-y-2"><Label>Existing Loan Exposure</Label><Input type="number" {...register("loanExposure")} /></div>
        <div className="space-y-2"><Label>Outstanding Debt</Label><Input type="number" {...register("outstandingDebt")} /></div>
        <div className="space-y-2"><Label>Working Capital Limit</Label><Input type="number" {...register("wcLimit")} /></div>
        <div className="space-y-2"><Label>Cash Credit Limit</Label><Input type="number" {...register("ccLimit")} /></div>
        <div className="space-y-2"><Label>Overdraft Limit</Label><Input type="number" {...register("odLimit")} /></div>
        <div className="space-y-2"><Label>Relationship Since</Label><Input type="date" {...register("bankRelationSince")} /></div>
      </Section>

      {/* SECTION 5: PORTFOLIO DETAILS */}
      <Section title="5. Portfolio Details">
        <FullWidth>
          <div className="space-y-3 mb-4">
            <Label>Current Holdings</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-md bg-secondary/20">
              {HOLDINGS_OPTIONS.map((bank) => (
                <div key={bank} className="flex items-center space-x-2">
                  <Controller
                    name="holdings"
                    control={control}
                    render={({ field }) => {
                      const isChecked = field.value?.includes(bank);
                      return (
                        <Checkbox 
                          id={`chk-${bank}`} 
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...(field.value || []), bank]);
                            } else {
                              field.onChange((field.value || []).filter((v: string) => v !== bank));
                            }
                          }}
                        />
                      );
                    }}
                  />
                  <label htmlFor={`chk-${bank}`} className="text-sm cursor-pointer">{bank}</label>
                </div>
              ))}
            </div>
          </div>
        </FullWidth>
        <div className="space-y-2"><Label>Portfolio Value</Label><Input type="number" {...register("portValue")} /></div>
        <div className="space-y-2"><Label>Investment Strategy</Label><Input {...register("portStrategy")} /></div>
        <div className="space-y-2"><Label>Risk Appetite</Label><Input {...register("portRisk")} /></div>
        <div className="space-y-2"><Label>Investment Horizon</Label><Input {...register("portHorizon")} /></div>
        <div className="space-y-2"><Label>Benchmark Index</Label><Input {...register("portBenchmark")} /></div>
      </Section>

      {/* SECTION 6: DOCUMENT UPLOAD */}
      <Section title="6. Document Upload">
        <FullWidth>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div 
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors cursor-pointer min-h-[200px]
                  ${isDragging ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-secondary/20'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-sm font-medium mb-1">Drag and drop files here</p>
                <p className="text-xs text-muted-foreground mb-4">Max 25MB per file (PDF, XLSX, CSV, DOCX, ZIP, PNG, JPEG)</p>
                <Button type="button" variant="outline" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>Browse Files</Button>
                <input 
                  type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileSelect}
                  accept=".pdf,.xlsx,.csv,.docx,.zip,.png,.jpeg,.jpg"
                />
              </div>

              {files.length > 0 && (
                <div className="mt-6 border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground text-left">
                      <tr>
                        <th className="p-3 font-medium">Filename</th>
                        <th className="p-3 font-medium">Type</th>
                        <th className="p-3 font-medium">Size</th>
                        <th className="p-3 font-medium">Upload Date</th>
                        <th className="p-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {files.map((f, i) => (
                        <tr key={i} className="bg-card">
                          <td className="p-3 flex items-center gap-2">
                            {getFileIcon(f.file.type)}
                            <span className="truncate max-w-[200px]" title={f.file.name}>{f.file.name}</span>
                          </td>
                          <td className="p-3 text-muted-foreground truncate max-w-[100px]">{f.file.type || "Unknown"}</td>
                          <td className="p-3 text-muted-foreground">{formatBytes(f.file.size)}</td>
                          <td className="p-3 text-muted-foreground">{f.date.toLocaleDateString()}</td>
                          <td className="p-3 text-right">
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(i)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="surface p-4 rounded-xl max-h-[400px] overflow-y-auto text-sm">
              <h4 className="font-medium mb-3">Required / Suggested Documents</h4>
              <ul className="space-y-2 text-muted-foreground">
                {REQUIRED_DOCS.map(doc => (
                  <li key={doc} className="flex items-start gap-2">
                    <div className="h-4 w-4 rounded border flex items-center justify-center mt-0.5 border-primary/50 text-primary">
                      {/* Check if a file matching this keyword was uploaded (fuzzy match for UX delight) */}
                      {files.some(f => f.file.name.toLowerCase().includes(doc.split(" ")[0].toLowerCase())) && <X className="h-3 w-3" />}
                    </div>
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </FullWidth>
      </Section>

      {/* SECTION 7: INTERNAL NOTES */}
      <Section title="7. Internal Notes">
        <FullWidth>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea {...register("notes")} className="min-h-[100px]" placeholder="Add any background context, special requirements..." />
          </div>
        </FullWidth>
        <div className="space-y-2"><Label>Tags (comma separated)</Label><Input {...register("tags")} /></div>
        <div className="space-y-2"><Label>Client Category</Label><Input {...register("clientCategory")} /></div>
        <div className="space-y-2"><Label>Special Instructions</Label><Input {...register("specialInstructions")} /></div>
        <FullWidth>
          <div className="space-y-2">
            <Label>Compliance Notes</Label>
            <Input {...register("complianceNotes")} placeholder="AML/KYC cleared status, exception approvals, etc." />
          </div>
        </FullWidth>
      </Section>

      {/* SECTION 8: ACTIONS */}
      <div className="flex items-center justify-end gap-4 border-t pt-6 pb-10">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="button" variant="secondary" onClick={onSaveDraft}>Save Draft</Button>
        <Button type="submit" size="lg" className="min-w-[150px]">Create Client</Button>
      </div>
    </form>
  );
}
