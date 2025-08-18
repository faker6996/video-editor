"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { callApi } from "@/lib/utils/api-client";
import { API_ROUTES } from "@/lib/constants/api-routes";

export default function EditorContainer() {
  const t = useTranslations("Common");
  const [role, setRole] = useState<string>("standard");

  useEffect(() => {
    callApi<{ role: string }>(API_ROUTES.ME.ROLE, "GET", undefined, { silent: true })
      .then((res) => setRole((res as any)?.role || "standard"))
      .catch(() => {});
  }, []);

  const isVip = role === 'vip' || role === 'admin';

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("videoEditor")}</h1>
      </header>

      {!isVip && (
        <section className="rounded-lg border p-6 bg-card">
          <p className="text-sm text-muted-foreground mb-3">{t("vipOnlyFeature")}</p>
          <Link href="../plans"><Button>{t("upgradeToVip")}</Button></Link>
        </section>
      )}

      <section className="rounded-lg border p-6 bg-card">
        <p className="text-muted-foreground">{t("comingSoon")}</p>
      </section>
    </div>
  );
}
