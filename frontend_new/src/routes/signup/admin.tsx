import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Building2, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export const Route = createFileRoute("/signup/admin")({
  head: () => ({
    meta: [
      { title: "Admin Organization Signup — FinSight Financial Intelligence" },
      {
        name: "description",
        content: "Register your organization workspace on FinSight Financial Intelligence.",
      },
    ],
  }),
  component: AdminSignupPage,
});

const schema = z.object({
  orgName: z.string().min(2, "Organization Name must be at least 2 characters"),
  adminName: z.string().min(2, "Admin Name must be at least 2 characters"),
  email: z.string().min(1, "Official Email is required").email("Enter a valid work email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  phone: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  orgType: z.string().min(1, "Organization Type is required"),
  agree: z.boolean().refine((val) => val === true, { message: "You must agree to the Terms & Privacy Policy" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof schema>;

function AdminSignupPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      orgName: "",
      adminName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      country: "",
      orgType: "",
      agree: false,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    // Frontend only implementation ready for backend integration
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success(`Organization '${values.orgName}' registration submitted successfully! Ready for verification & setup.`);
      navigate({ to: "/login" });
    }, 1000);
  };

  return (
    <div className="gradient-hero flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/get-started"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to role selection
          </Link>
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.jpeg"
              alt="FinSight Financial Intelligence"
              className="size-9 rounded-xl object-cover shadow-[var(--shadow-glow)]"
            />
            <span className="leading-tight">
              <span className="block font-bold">FinSight</span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Financial Intelligence
              </span>
            </span>
          </div>
        </div>

        <div className="surface p-7 sm:p-10 rounded-2xl border border-border/80 bg-card/95 backdrop-blur shadow-[var(--shadow-elevated)]">
          <div className="flex items-center gap-3 border-b border-border/60 pb-6">
            <div className="inline-flex rounded-xl bg-primary/10 p-3 text-primary">
              <ShieldCheck className="size-7" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Register Organization</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Set up an enterprise administrator account and firm workspace.
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="orgName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Organization Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Apex Advisory Services" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="orgType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Organization Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select firm category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Consultancy & Advisory">Consultancy & Advisory</SelectItem>
                          <SelectItem value="Institutional Asset Management">Institutional Asset Management</SelectItem>
                          <SelectItem value="Wealth Management Firm">Wealth Management Firm</SelectItem>
                          <SelectItem value="Corporate Banking Advisory">Corporate Banking Advisory</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="adminName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Admin Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Rajiv Menon" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Official Email</FormLabel>
                      <FormControl>
                        <Input placeholder="admin@organization.com" type="email" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Password</FormLabel>
                      <FormControl>
                        <Input placeholder="At least 8 characters" type="password" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Confirm Password</FormLabel>
                      <FormControl>
                        <Input placeholder="Re-enter your password" type="password" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Phone Number <span className="text-muted-foreground text-xs font-normal">(optional)</span></FormLabel>
                      <FormControl>
                        <Input placeholder="+91 98765 43210" type="tel" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Country</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. India" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="agree"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border/80 bg-muted/30 p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium text-foreground">
                        I agree to the Terms & Privacy Policy
                      </FormLabel>
                      <p className="text-xs text-muted-foreground mt-1">
                        By registering, you confirm that you are an authorized firm representative.
                      </p>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full font-semibold mt-2 py-6 text-base shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    Creating Organization...
                  </>
                ) : (
                  "Create Organization"
                )}
              </Button>
            </form>
          </Form>
        </div>

        <div className="text-center text-sm font-medium text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
