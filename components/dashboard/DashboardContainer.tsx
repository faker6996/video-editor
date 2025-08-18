"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";

export default function DashboardContainer() {
  const t = useTranslations("Common");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("dashboardTitle")}</h1>
        <div className="flex gap-3">
          <Link href="./editor">
            <Button variant="primary">{t("openEditor")}</Button>
          </Link>
          <Link href="./plans">
            <Button variant="outline">{t("upgradeToVip")}</Button>
          </Link>
        </div>
      </div>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border p-4 bg-card">
          <h3 className="font-medium mb-1">{t("videoEditor")}</h3>
          <p className="text-sm text-muted-foreground">{t("comingSoon")}</p>
        </div>
        <div className="rounded-lg border p-4 bg-card">
          <h3 className="font-medium mb-1">{t("vip")}</h3>
          <p className="text-sm text-muted-foreground">{t("vipFeatures")}</p>
        </div>
        <div className="rounded-lg border p-4 bg-card">
          <h3 className="font-medium mb-1">{t("standard")}</h3>
          <p className="text-sm text-muted-foreground">{t("standardFeatures")}</p>
        </div>
      </section>
    </div>
  );
}
