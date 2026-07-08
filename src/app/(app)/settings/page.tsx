import { Suspense } from "react";
import { SettingsView } from "@/features/settings/settings-view";

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsView />
    </Suspense>
  );
}
