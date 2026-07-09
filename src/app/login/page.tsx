"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Boxes, Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useAuth, DEMO_CREDENTIALS } from "@/lib/auth/auth";
import { useT } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const { t } = useT();

  const [email, setEmail] = React.useState(DEMO_CREDENTIALS.email);
  const [password, setPassword] = React.useState(DEMO_CREDENTIALS.password);
  const [showPassword, setShowPassword] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [error, setError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // already signed in → go to app
  React.useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = login(email, password);
    if (res.ok) {
      router.replace("/dashboard");
    } else {
      setError(res.error ?? "Invalid email or password");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white">
            <Boxes className="h-7 w-7" />
          </span>
          <h1 className="mt-3 text-xl font-semibold text-content">AutoParts</h1>
          <p className="text-sm text-content-muted">{t("Inventory System")}</p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6 shadow-card">
          <h2 className="text-lg font-semibold text-content">{t("Sign in")}</h2>
          <p className="mt-1 text-sm text-content-muted">
            {t("Enter your credentials to access your account")}
          </p>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {t(error)}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div>
              <Label required>{t("Email")}</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                leftIcon={<Mail className="h-4 w-4" />}
                autoFocus
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label className="mb-0">{t("Password")}</Label>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => setError(t("Password reset is not available in the demo."))}
                >
                  {t("Forgot password?")}
                </button>
              </div>
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-3 text-content-subtle">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-9 w-full rounded border border-border-strong bg-surface pl-9 pr-9 text-sm text-content placeholder:text-content-subtle transition-colors focus-ring hover:border-content-subtle"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 rounded p-1 text-content-subtle hover:text-content"
                  aria-label={showPassword ? t("Hide password") : t("Show password")}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-content-muted">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-border-strong accent-primary"
              />
              {t("Remember me")}
            </label>

            <Button type="submit" loading={submitting} className="w-full">
              {t("Sign in")}
            </Button>
          </form>

          {/* Demo hint */}
          <div className="mt-5 rounded-md border border-dashed border-border-strong bg-surface-muted px-3 py-2.5 text-xs text-content-muted">
            <p className="font-medium text-content">{t("Demo account")}</p>
            <p className="mt-0.5">
              {t("Email")}: {DEMO_CREDENTIALS.email}
            </p>
            <p>
              {t("Password")}: {DEMO_CREDENTIALS.password}
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-content-subtle">
          © {new Date().getFullYear()} AutoParts · {t("Inventory System")}
        </p>
      </div>
    </div>
  );
}
