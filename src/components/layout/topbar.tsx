"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Menu, User, Lock, LogOut, UserCog } from "lucide-react";
import { useSidebar } from "./sidebar-context";
import { GlobalSearch } from "./global-search";
import { Notifications } from "./notifications";
import {
  Dropdown,
  DropdownItem,
  DropdownDivider,
} from "@/components/ui/dropdown";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";

export function Topbar() {
  const { setMobileOpen } = useSidebar();
  const toast = useToast();
  const router = useRouter();
  const { t } = useT();
  const [changePw, setChangePw] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface px-4">
      <button
        onClick={() => setMobileOpen(true)}
        className="rounded p-1.5 text-content-muted hover:bg-surface-muted lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex flex-1 items-center">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-1">
        <Notifications />

        <Dropdown
          trigger={
            <button className="ml-1 flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-surface-muted">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                AF
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium leading-tight text-content">
                  Ayoub Fellat
                </span>
                <span className="block text-xs leading-tight text-content-muted">
                  {t("Administrator")}
                </span>
              </span>
            </button>
          }
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="text-sm font-medium text-content">Ayoub Fellat</p>
            <p className="text-xs text-content-muted">ayoubfellat2016@gmail.com</p>
          </div>
          <DropdownItem icon={<User className="h-4 w-4" />} onClick={() => router.push("/profile")}>
            {t("My Profile")}
          </DropdownItem>
          <DropdownItem icon={<UserCog className="h-4 w-4" />} onClick={() => router.push("/settings?tab=company")}>
            {t("Account Settings")}
          </DropdownItem>
          <DropdownItem icon={<Lock className="h-4 w-4" />} onClick={() => setChangePw(true)}>
            {t("Change Password")}
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem
            tone="danger"
            icon={<LogOut className="h-4 w-4" />}
            onClick={() => toast.toast({ tone: "info", title: t("Logout"), description: "Authentication arrives with the Supabase integration." })}
          >
            {t("Logout")}
          </DropdownItem>
        </Dropdown>
      </div>

      {/* Change password dialog */}
      <Dialog
        open={changePw}
        onClose={() => setChangePw(false)}
        title={t("Change password")}
        footer={
          <>
            <Button variant="secondary" onClick={() => setChangePw(false)}>{t("Cancel")}</Button>
            <Button
              onClick={() => {
                setChangePw(false);
                toast.success(t("Password updated"), t("Your password has been changed."));
              }}
            >
              {t("Update password")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label required>{t("Current password")}</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <div>
            <Label required>{t("New password")}</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <div>
            <Label required>{t("Confirm new password")}</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
        </div>
      </Dialog>
    </header>
  );
}
