import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, KeyRound, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const Route = createFileRoute("/verify-otp")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search["email"] === "string" ? search["email"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Verify OTP — FinSight Workspace" },
      { name: "description", content: "Verify your 6-digit one-time password." },
    ],
  }),
  component: VerifyOtpPage,
});

const schema = z.object({
  otp: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d{6}$/, "Must contain only digits"),
});

type FormValues = z.infer<typeof schema>;

function VerifyOtpPage() {
  const navigate = useNavigate();
  const { email } = Route.useSearch();
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { otp: "" },
  });

  const onSubmit = (values: FormValues) => {
    setError(null);
    if (!email) {
      setError("Email context lost. Please start from the Forgot Password page.");
      return;
    }
    toast.success("OTP verified! Please create your new password.");
    navigate({ to: "/reset-password", search: { email, otp: values.otp } });
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setIsResending(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        throw new Error("Failed to resend OTP");
      }
      toast.success("A new 6-digit OTP has been sent to your email.");
      setCooldown(60);
    } catch (e) {
      toast.error("Could not resend OTP. Please try again later.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="gradient-hero flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-5">
        <Link
          to="/forgot-password"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Change email address
        </Link>

        <div className="surface p-7 sm:p-8">
          <div className="flex items-center gap-2.5">
            <img src="/logo.jpeg" alt="FinSight" className="size-10 rounded-xl object-cover shadow-[var(--shadow-glow)]" />
            <span className="leading-tight">
              <span className="block font-bold">FinSight</span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Verification
              </span>
            </span>
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight">Enter verification code</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We sent a 6-digit verification code to <span className="font-semibold text-foreground">{email || "your email"}</span>.
          </p>

          {error ? (
            <Alert variant="destructive" className="mt-5">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>6-Digit OTP</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        autoComplete="one-time-code"
                        placeholder="123456"
                        className="text-center text-lg font-mono tracking-widest"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                <KeyRound className="size-4" aria-hidden />
                Verify
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            {cooldown > 0 ? (
              <span>Resend OTP in <span className="font-mono font-medium text-foreground">{cooldown}s</span></span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="inline-flex items-center gap-1.5 font-semibold text-primary transition-colors hover:underline disabled:opacity-50"
              >
                <RefreshCw className={`size-3 ${isResending ? "animate-spin" : ""}`} />
                Resend OTP
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
