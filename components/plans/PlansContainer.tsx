"use client";

import { useEffect, useState } from "react";
import { Crown, Check, Star, Zap, Shield, Clock, Infinity, CreditCard, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Badge, StatusBadge, TagBadge, GradientBadge } from "@/components/ui/Badge";
import Progress from "@/components/ui/Progress";
import { Tooltip } from "@/components/ui/Tooltip";
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
  features?: any;
}

export default function PlansContainer() {
  const t = useTranslations("Common");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    callApi<Plan[]>(API_ROUTES.SUBSCRIPTIONS.PLANS, "GET", undefined, { silent: true })
      .then(setPlans)
      .catch(() => {});
  }, []);

  const onSubscribe = async (code: string) => {
    setSelectedPlan(code);
    setLoading(true);
    try {
      await callApi(API_ROUTES.SUBSCRIPTIONS.ME, "POST", { planCode: code, gateway: "momo" });
      alert(t("subscriptionCreated"));
    } catch (e: any) {
      alert(e?.message || t("subscriptionFailed"));
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const formatPrice = (priceCents: number, currency: string) => {
    return `${(priceCents / 100).toLocaleString()} ${currency}`;
  };

  const getPlanIcon = (code: string) => {
    if (code.includes("LIFETIME")) return <Crown className="w-6 h-6 text-warning" />;
    if (code.includes("YEAR")) return <Star className="w-6 h-6 text-primary" />;
    if (code.includes("MONTH")) return <Zap className="w-6 h-6 text-info" />;
    return <Shield className="w-6 h-6 text-success" />;
  };

  const getPlanBadge = (plan: Plan) => {
    if (plan.is_lifetime) {
      return (
        <GradientBadge size="sm" pulse>
          🏆 {t("mostPopular")}
        </GradientBadge>
      );
    }
    if (plan.code.includes("YEAR")) {
      return (
        <Badge variant="primary" size="sm">
          💎 {t("bestValue")}
        </Badge>
      );
    }
    if (plan.code.includes("VIP")) {
      return (
        <Badge variant="success" size="sm">
          ⭐ Premium
        </Badge>
      );
    }
    return null;
  };

  const getPopularityScore = (plan: Plan) => {
    if (plan.is_lifetime) return 95;
    if (plan.code.includes("YEAR")) return 85;
    if (plan.code.includes("MONTH")) return 70;
    return 60;
  };

  const getDefaultFeatures = (code: string) => {
    const baseFeatures = [t("hdVideoExport"), t("basicEditingTools"), t("cloudStorage"), t("support247")];

    if (code.includes("VIP")) {
      return [
        ...baseFeatures,
        t("fourKVideoExport"),
        t("advancedFilters"),
        t("autoSubtitles"),
        t("multiLanguageSupport"),
        t("priorityProcessing"),
        t("advancedAnalytics"),
      ];
    }
    return baseFeatures;
  };

  const isPlanRecommended = (plan: Plan) => {
    return plan.is_lifetime || plan.code.includes("YEAR");
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Crown className="w-8 h-8 text-warning" />
          <h1 className="text-3xl font-bold text-foreground">{t("chooseYourPlan")}</h1>
          <Badge variant="gradient" size="sm">
            {t("newFeatures")}
          </Badge>
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {t("unlockPowerfulFeatures")}
        </p>
        <div className="flex items-center justify-center gap-4">
          <StatusBadge status="online" size="sm" />
          <StatusBadge status="busy" size="sm" />
          <StatusBadge status="away" size="sm" />
        </div>
      </div>

      {/* Enhanced Stats Banner */}
      <Card className="p-6 bg-gradient-to-r from-primary/5 to-info/5 dark:from-primary/15 dark:to-info/15 border border-primary/20 dark:border-primary/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              <span className="text-2xl font-bold">10K+</span>
              <Badge variant="success" size="xs">
                {t("growing")}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{t("videosProcessed")}</p>
            <Progress value={85} className="w-20 mx-auto" size="sm" variant="success" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">24/7</span>
              <Badge variant="primary" size="xs" pulse>
                {t("live")}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{t("supportAvailable")}</p>
            <Progress value={100} className="w-20 mx-auto" size="sm" variant="primary" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-warning" />
              <span className="text-2xl font-bold">99.9%</span>
              <Badge variant="outline" size="xs">
                {t("guaranteed")}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{t("uptimeGuarantee")}</p>
            <Progress value={99.9} className="w-20 mx-auto" size="sm" variant="warning" />
          </div>
        </div>
      </Card>

      {/* Enhanced Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 pt-4">
        {plans.map((plan) => {
          const features = plan.features?.features || getDefaultFeatures(plan.code);
          const isRecommended = isPlanRecommended(plan);
          const isLoading = loading && selectedPlan === plan.code;
          const popularityScore = getPopularityScore(plan);

          return (
            <Card
              key={plan.id}
              className={`relative p-6 pt-8 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 dark:hover:shadow-primary/20 ${
                isRecommended ? "ring-2 ring-primary/20 dark:ring-primary/30 border-primary/30 dark:border-primary/40 transform hover:scale-105" : ""
              }`}
            >
              {/* Enhanced Recommended Badge */}
              {getPlanBadge(plan) && <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">{getPlanBadge(plan)}</div>}

              <div className="space-y-6">
                {/* Enhanced Plan Header */}
                <div className="text-center space-y-3">
                  <div className="flex justify-center items-center gap-2">
                    {getPlanIcon(plan.code)}
                    <TagBadge size="xs">{plan.code}</TagBadge>
                  </div>
                  <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
                    {plan.name}
                    {plan.is_lifetime && (
                      <Badge variant="gradient" size="xs">
                        ♾️
                      </Badge>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>

                  {/* Popularity Indicator */}
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs text-muted-foreground">{t("popularity")}:</span>
                    <Progress value={popularityScore} className="w-16" size="sm" variant="primary" />
                    <Badge variant="ghost" size="xs">
                      {popularityScore}%
                    </Badge>
                  </div>
                </div>

                {/* Enhanced Pricing */}
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold flex items-center justify-center gap-2">
                    {formatPrice(plan.price_cents, plan.currency)}
                    {plan.price_cents === 0 && (
                      <Badge variant="success" size="sm">
                        {t("free")}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    {plan.is_lifetime ? (
                      <>
                        <Infinity className="w-4 h-4" />
                        <Badge variant="gradient" size="xs">
                          {t("oneTimePayment")}
                        </Badge>
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4" />
                        <Badge variant="outline" size="xs">
                          {t("daysCount", { days: plan.duration_days ?? 0 })}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>

                {/* Enhanced Features */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{t("whatsIncluded")}:</h4>
                    <Badge variant="info" size="xs">
                      {t("featuresCount", { count: features.length })}
                    </Badge>
                  </div>
                  <ul className="space-y-2">
                    {features.slice(0, 6).map((feature: string, index: number) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-success flex-shrink-0" />
                        <span>{feature}</span>
                        {index < 2 && (
                          <Badge variant="success" size="xs">
                            {t("popular")}
                          </Badge>
                        )}
                      </li>
                    ))}
                    {features.length > 6 && (
                      <li className="flex items-center gap-2">
                        <Badge variant="primary" size="sm">
                          {t("moreFeatures", { count: features.length - 6 })}
                        </Badge>
                      </li>
                    )}
                  </ul>
                </div>

                {/* Enhanced CTA Button */}
                <Tooltip content={`${plan.name} - ${plan.description}`}>
                  <Button
                    variant={isRecommended ? "primary" : "outline"}
                    className="w-full gap-2"
                    onClick={() => onSubscribe(plan.code)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        <Badge variant="warning" size="xs">
                          {t("processing")}
                        </Badge>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        {plan.is_lifetime ? (
                          <Badge variant="gradient" size="sm">
                            {t("getLifetimeAccess")}
                          </Badge>
                        ) : (
                          t("startFreeTrial")
                        )}
                      </>
                    )}
                  </Button>
                </Tooltip>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Enhanced FAQ Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-lg font-semibold">{t("frequentlyAskedQuestions")}</h3>
            <Badge variant="info" size="sm">
              FAQ
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{t("canChangePlanAnytime")}</h4>
                <StatusBadge status="online" size="xs">
                  ✓ {t("yes")}
                </StatusBadge>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("canChangePlanAnswer")}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{t("isThereFreeTrial")}</h4>
                <StatusBadge status="idle" size="xs">
                  7 {t("days")}
                </StatusBadge>
              </div>
              <p className="text-sm text-muted-foreground">{t("freeTrialAnswer")}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{t("whatPaymentMethods")}</h4>
                <Badge variant="primary" size="xs">
                  {t("multiple")}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{t("paymentMethodsAnswer")}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{t("canCancelAnytime")}</h4>
                <StatusBadge status="away" size="xs">
                  ⚠️ {t("anytime")}
                </StatusBadge>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("cancelAnytimeAnswer")}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
