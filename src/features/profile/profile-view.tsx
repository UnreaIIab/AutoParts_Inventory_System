"use client";

import * as React from "react";
import { Camera, Lock, Mail, Phone, Shield, User } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useT, type Lang } from "@/lib/i18n";

interface Profile {
  name: string;
  email: string;
  phone: string;
  role: string;
  jobTitle: string;
  bio: string;
  avatar: string;
}

const DEFAULT_PROFILE: Profile = {
  name: "Ayoub Fellat",
  email: "ayoubfellat2016@gmail.com",
  phone: "+1 555 0000",
  role: "Administrator",
  jobTitle: "Inventory Manager",
  bio: "Manages the AutoParts inventory, purchasing and sales operations.",
  avatar: "",
};

const STORAGE_KEY = "autoparts:profile";

function loadProfile(): Profile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function ProfileView() {
  const toast = useToast();
  const { t, lang, setLang } = useT();
  const [profile, setProfile] = React.useState<Profile>(DEFAULT_PROFILE);
  const [form, setForm] = React.useState<Profile>(DEFAULT_PROFILE);
  const [langDraft, setLangDraft] = React.useState<Lang>(lang);
  const [changePw, setChangePw] = React.useState(false);

  React.useEffect(() => {
    const loaded = loadProfile();
    setProfile(loaded);
    setForm(loaded);
  }, []);

  // keep the draft in sync with the applied language (e.g. after saving)
  React.useEffect(() => setLangDraft(lang), [lang]);

  const dirty =
    JSON.stringify(profile) !== JSON.stringify(form) || langDraft !== lang;

  const set =
    (k: keyof Profile) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const onAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, avatar: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    setProfile(form);
    if (langDraft !== lang) setLang(langDraft); // apply language only on save
    toast.success(t("Profile saved"), t("Your changes have been stored."));
  };

  const initials = form.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <PageHeader
        title={t("My Profile")}
        subtitle={t("Manage your personal information and account security")}
        actions={
          <>
            <Button
              variant="secondary"
              disabled={!dirty}
              onClick={() => {
                setForm(profile);
                setLangDraft(lang);
              }}
            >
              {t("Cancel")}
            </Button>
            <Button disabled={!dirty} onClick={save}>
              {t("Save changes")}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[320px_1fr]">
        {/* Summary card */}
        <div className="space-y-5">
          <Card className="p-0">
            <CardContent className="flex flex-col items-center py-8 text-center">
              <div className="relative">
                {form.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.avatar}
                    alt={form.name}
                    className="h-24 w-24 rounded-full border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-white">
                    {initials}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-content-muted shadow-card hover:text-content">
                  <Camera className="h-4 w-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={onAvatar} />
                </label>
              </div>
              <p className="mt-4 text-lg font-semibold text-content">{form.name}</p>
              <p className="text-sm text-content-muted">{form.jobTitle}</p>
              <Badge tone="primary" className="mt-3">
                <Shield className="mr-1 h-3 w-3" />
                {t(form.role)}
              </Badge>
            </CardContent>
          </Card>

          <Card className="p-0">
            <CardHeader>
              <CardTitle>{t("Contact")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-content-muted">
                <Mail className="h-4 w-4" /> <span className="text-content">{form.email}</span>
              </div>
              <div className="flex items-center gap-2 text-content-muted">
                <Phone className="h-4 w-4" /> <span className="text-content">{form.phone || "—"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Editable details */}
        <div className="space-y-5">
          <Card className="p-0">
            <CardHeader>
              <CardTitle>{t("Personal Information")}</CardTitle>
              <User className="h-5 w-5 text-content-muted" />
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label required>{t("Full name")}</Label>
                <Input value={form.name} onChange={set("name")} />
              </div>
              <div>
                <Label>{t("Job title")}</Label>
                <Input value={form.jobTitle} onChange={set("jobTitle")} />
              </div>
              <div>
                <Label required>{t("Email")}</Label>
                <Input type="email" value={form.email} onChange={set("email")} />
              </div>
              <div>
                <Label>{t("Phone")}</Label>
                <Input value={form.phone} onChange={set("phone")} />
              </div>
              <div>
                <Label>{t("Language")}</Label>
                <Select
                  value={langDraft}
                  onChange={(e) => setLangDraft(e.target.value as Lang)}
                >
                  <option value="en">{t("English")}</option>
                  <option value="fr">{t("French")}</option>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>{t("Bio")}</Label>
                <Textarea rows={3} value={form.bio} onChange={set("bio")} />
              </div>
            </CardContent>
          </Card>

          <Card className="p-0">
            <CardHeader>
              <CardTitle>{t("Security")}</CardTitle>
              <Lock className="h-5 w-5 text-content-muted" />
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-content">{t("Password")}</p>
                <p className="text-xs text-content-muted">{t("Last changed — not available in demo")}</p>
              </div>
              <Button variant="secondary" icon={<Lock className="h-4 w-4" />} onClick={() => setChangePw(true)}>
                {t("Change Password")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

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
    </>
  );
}
