"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Link from "next/link";

interface Subscription {
  id: number;
  status: string;
  start_at?: string;
  end_at?: string | null;
  auto_renew?: boolean;
  payment_gateway?: string;
  plan_id?: number;
}

import { useTranslations } from "next-intl";
import { callApi } from "@/lib/utils/api-client";
import { API_ROUTES } from "@/lib/constants/api-routes";

export default function SubscriptionContainer() {
  const t = useTranslations("Common");
  const [sub, setSub] = useState<Subscription | null>(null);
  const [role, setRole] = useState<string>("standard");

  useEffect(() => {
    callApi<Subscription | null>(API_ROUTES.SUBSCRIPTIONS.ME, "GET", undefined, { silent: true })
      .then((res) => setSub(res || null))
      .catch(() => {});

    callApi<{ role: string }>(API_ROUTES.ME.ROLE, "GET", undefined, { silent: true })
      .then((res) => setRole((res as any)?.role || "standard"))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("mySubscription")}</h1>
      <div className="rounded-lg border p-5 bg-card">
        <div className="mb-2">
          <span className="font-medium">{t("role")}:</span> <span className="uppercase">{role}</span>
        </div>
        {sub ? (
          <div className="text-sm space-y-1 text-muted-foreground">
            <div>{t("status")}: {sub.status}</div>
            {sub.start_at && <div>{t("start")}: {new Date(sub.start_at).toLocaleString()}</div>}
            {sub.end_at && <div>{t("end")}: {new Date(sub.end_at).toLocaleString()}</div>}
            <div>{t("autoRenew")}: {sub.auto_renew ? "Yes" : "No"}</div>
            {sub.payment_gateway && <div>{t("gateway")}: {sub.payment_gateway}</div>}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">{t("noActiveSubscription")}</div>
        )}
        <div className="mt-4 flex gap-3">
          <Link href="../plans">
            <Button>{t("viewPlans")}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
