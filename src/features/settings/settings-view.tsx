"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Tags, Building2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { EntityManager } from "./entity-manager";
import { db } from "@/lib/store/db";
import { useCollection } from "@/lib/store/hooks";

export function SettingsView() {
  const toast = useToast();
  const { t } = useT();
  const params = useSearchParams();
  const [tab, setTab] = React.useState(params.get("tab") || "categories");

  React.useEffect(() => {
    const tabParam = params.get("tab");
    if (tabParam) setTab(tabParam);
  }, [params]);

  const products = useCollection(db.products);
  const categories = useCollection(db.categories);

  return (
    <>
      <PageHeader
        title={t("Settings")}
        subtitle={t("Manage categories and company profile")}
      />
      <div className="p-5">
        <Tabs
          className="mb-4"
          active={tab}
          onChange={setTab}
          tabs={[
            { id: "categories", label: t("Categories"), count: categories.length },
            { id: "company", label: t("Company") },
          ]}
        />

        {tab === "categories" && (
          <div className="max-w-3xl">
            <EntityManager
              collection={db.categories}
              singular="Category"
              plural="Categories"
              icon={<Tags className="h-4 w-4" />}
              usageLabel="products"
              archivable
              usageCount={(c) =>
                products.filter((p) => p.category === c.name).length
              }
            />
          </div>
        )}

        {tab === "company" && <CompanyProfile onSave={() => toast.success(t("Company profile saved"))} />}
      </div>
    </>
  );
}

function CompanyProfile({ onSave }: { onSave: () => void }) {
  const { t } = useT();
  return (
    <Card className="max-w-2xl p-0">
      <CardHeader>
        <CardTitle>{t("Company Profile")}</CardTitle>
        <Building2 className="h-5 w-5 text-content-muted" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>{t("Company name")}</Label>
            <Input defaultValue="AutoParts Trading Co." />
          </div>
          <div>
            <Label>{t("Email")}</Label>
            <Input defaultValue="contact@autoparts.com" />
          </div>
          <div>
            <Label>{t("Phone")}</Label>
            <Input defaultValue="+1 555 0000" />
          </div>
          <div className="sm:col-span-2">
            <Label>{t("Address")}</Label>
            <Input defaultValue="1200 Industrial Ave, Detroit, MI" />
          </div>
          <div>
            <Label>{t("Currency")}</Label>
            <Input defaultValue="MAD (DH)" />
          </div>
          <div>
            <Label>{t("Tax rate (%)")}</Label>
            <Input defaultValue="8.0" type="number" />
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={onSave}>{t("Save changes")}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
