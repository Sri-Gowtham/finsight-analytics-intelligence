import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Building2, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState<boolean | null>(null);

  // Check if Google OAuth credentials are configured on the backend
  useEffect(() => {
    fetch("/api/auth/google/status")
      .then((res) => res.json())
      .then((data: { configured: boolean }) => setGoogleConfigured(data.configured))
      .catch(() => setGoogleConfigured(false));
  }, []);

  const isGoogleDisabled = googleConfigured === false;

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
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.adminName,
          email: values.email,
          password: values.password,
          role: "Admin",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }
      toast.success(`Organization '${values.orgName}' registered successfully! Please sign in.`);
      navigate({ to: "/login" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to register organization");
    } finally {
      setIsSubmitting(false);
    }
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
                        <div className="relative">
                          <Input placeholder="At least 8 characters" type={showPassword ? "text" : "password"} {...field} className="bg-background pr-10" />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
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
                        <div className="relative">
                          <Input placeholder="Re-enter your password" type={showConfirmPassword ? "text" : "password"} {...field} className="bg-background pr-10" />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
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

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">Or continue with</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="relative mt-4 group">
            <button
              id="google-signup-btn"
              type="button"
              disabled={isGoogleDisabled}
              onClick={() => {
                if (!isGoogleDisabled) {
                  window.location.href = "/api/auth/google";
                }
              }}
              className={`flex w-full items-center justify-center gap-3 rounded-lg border px-4 py-2.5 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 ${
                isGoogleDisabled
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500"
                  : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50 dark:bg-white dark:text-gray-800 dark:hover:bg-gray-100"
              }`}
            >
              <svg className={`size-4 ${isGoogleDisabled ? "opacity-40" : ""}`} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google
            </button>
            {isGoogleDisabled && (
              <div className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-gray-700">
                Google sign-in is not configured for this environment
                <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
              </div>
            )}
          </div>
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
