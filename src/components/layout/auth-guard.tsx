"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Boxes, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth";

/** Protects the app shell: unauthenticated visitors are sent to /login. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas">
        <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-white">
          <Boxes className="h-6 w-6" />
        </span>
        <Loader2 className="h-5 w-5 animate-spin text-content-subtle" />
      </div>
    );
  }

  return <>{children}</>;
}
