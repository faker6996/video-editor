"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { useTranslations } from "next-intl";
import { callApi } from "@/lib/utils/api-client";
import { API_ROUTES } from "@/lib/constants/api-routes";

interface Plan {
  id: number;
  code: string;
  name: string;
  description?: string;
  duration_days?: number | null;
  is_lifetime?: boolean;
  price_cents: number;
  currency: string;
}

export default function PlansContainer() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const t = useTranslations("Common");

  useEffect(() => {
    callApi<Plan[]>(API_ROUTES.SUBSCRIPTIONS.PLANS, "GET", undefined, { silent: true })
      .then(setPlans)
      .catch(() => {});
  }, []);

  const onSubscribe = async (code: string) => {
    setLoading(true);
    try {
      await callApi(API_ROUTES.SUBSCRIPTIONS.ME, "POST", { planCode: code, gateway: "momo" });
      alert("Subscription created (mock). Role cookie set.");
    } catch (e: any) {
      alert(e?.message || "Failed to subscribe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("plansTitle")}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p.id} className="rounded-lg border p-5 bg-card">
            <div className="font-medium text-lg">{p.name}</div>
            <div className="text-muted-foreground text-sm mt-1">{p.description}</div>
            <div className="mt-3 text-xl font-semibold">
              {(p.price_cents / 100).toLocaleString()} {p.currency}
            </div>
            <div className="text-xs text-muted-foreground">
              {p.is_lifetime ? t("lifetime") : t("daysCount", { days: p.duration_days ?? 0 })}
            </div>
            <div className="mt-4">
              <Button disabled={loading} onClick={() => onSubscribe(p.code)}>
                {loading ? t("processing") : t("upgrade")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
