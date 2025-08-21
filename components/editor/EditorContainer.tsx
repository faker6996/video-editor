"use client";

import { useEffect, useRef, useState } from "react";
import {
  Play,
  Upload,
  Download,
  Settings,
  Layers,
  Volume2,
  Scissors,
  Palette,
  Type,
  Image as ImageIcon,
  Crown,
  Zap,
  Lock,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { callApi } from "@/lib/utils/api-client";
import { API_ROUTES } from "@/lib/constants/api-routes";
import { useTranslations } from "next-intl";
import { useLocale } from "@/lib/hooks/useLocale";

export default function EditorContainer() {
  const [role, setRole] = useState<string>("standard");
  const [loading, setLoading] = useState(true);
  const t = useTranslations("Common");
  const router = useRouter();
  const locale = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // 1) Upload raw video file
      const fd = new FormData();
      fd.set("file", file);
      const up: any = await callApi(API_ROUTES.UPLOAD.VIDEO, "POST", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const { storage_path, filename } = up || {};

      // 2) Create a new video task (project)
      const task: any = await callApi(API_ROUTES.VIDEO_TASKS.LIST, "POST", {
        title: filename || "New Project",
        description: "Uploaded via editor",
      });

      // 3) Attach uploaded video to the task
      if (task?.id && storage_path) {
        await callApi(API_ROUTES.VIDEO_TASKS.VIDEOS(task.id), "POST", {
          storage_path,
          filename,
        });
        // 4) Navigate to task detail to continue editing
        router.push(`/${locale}/video-tasks/${task.id}`);
      }
    } catch (err: any) {
      // callApi already alerts on failure; keep this minimal
      console.error("Upload failed:", err);
    } finally {
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    callApi<{ role: string }>(API_ROUTES.ME.ROLE, "GET", undefined, { silent: true })
      .then((res) => {
        setRole((res as any)?.role || "standard");
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const isVip = role === "vip" || role === "admin";

  const editorFeatures = [
    {
      title: t("videoTrimming"),
      description: t("cutTrimVideos"),
      icon: Scissors,
      available: true,
      color: "bg-primary/10 text-primary",
    },
    {
      title: t("audioControls"),
      description: t("adjustVolumeMusic"),
      icon: Volume2,
      available: true,
      color: "bg-success/10 text-success",
    },
    {
      title: t("textOverlay"),
      description: t("addTitlesCaptions"),
      icon: Type,
      available: isVip,
      color: "bg-info/10 text-info",
    },
    {
      title: t("filtersEffects"),
      description: t("applyStunningEffects"),
      icon: Palette,
      available: isVip,
      color: "bg-warning/10 text-warning",
    },
    {
      title: t("multiLayerEditing"),
      description: t("workWithMultipleTracks"),
      icon: Layers,
      available: isVip,
      color: "bg-secondary/10 text-secondary-foreground",
    },
    {
      title: t("imageOverlay"),
      description: t("addLogosWatermarks"),
      icon: ImageIcon,
      available: isVip,
      color: "bg-accent/10 text-accent-foreground",
    },
  ];

  const quickActions = [
    {
      title: t("uploadVideo"),
      description: t("startByUploadingVideo"),
      icon: Upload,
      action: () => {},
      variant: "primary" as const,
    },
    {
      title: t("loadProject"),
      description: t("continueWorkingProject"),
      icon: Play,
      action: () => {},
      variant: "outline" as const,
    },
    {
      title: t("settings"),
      description: t("configureEditorPreferences"),
      icon: Settings,
      action: () => {},
      variant: "outline" as const,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">{t("loadingPage")}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Play className="w-8 h-8 text-primary" />
            {t("videoEditor")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("professionalVideoEditing")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isVip ? "gradient" : "default"}>{isVip ? t("vipUser") : t("standardUser")}</Badge>
          {!isVip && (
            <Link href="../plans">
              <Button variant="primary" className="gap-2">
                <Crown className="w-4 h-4" />
                {t("upgradeToVIP")}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* VIP Upgrade Banner - only show for standard users */}
      {!isVip && (
        <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Crown className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{t("unlockPremiumFeatures")}</h3>
              <p className="text-muted-foreground mt-1">{t("upgradeToVipAccess")}</p>
            </div>
            <Link href="../plans">
              <Button variant="primary" className="gap-2">
                <Sparkles className="w-4 h-4" />
                {t("viewPlans")}
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{t("quickActions")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <action.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{action.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                </div>
                <Button variant={action.variant} size="sm" className="w-full">
                  {action.title}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{t("editorFeatures")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {editorFeatures.map((feature, index) => (
            <Card
              key={index}
              className={`p-6 transition-all duration-200 ${feature.available ? "hover:shadow-lg cursor-pointer" : "opacity-75 border-dashed"}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 ${feature.color} rounded-lg`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  {!feature.available && <Lock className="w-4 h-4 text-muted-foreground" />}
                </div>

                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    {feature.title}
                    {!feature.available && (
                      <Badge variant="outline" size="xs">
                        {t("vipOnly")}
                      </Badge>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                </div>

                {feature.available ? (
                  <Button variant="outline" size="sm" className="w-full">
                    {t("useFeature")}
                  </Button>
                ) : (
                  <Link href="../plans" className="block">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Crown className="w-3 h-3" />
                      {t("upgradeToUnlock")}
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Editor Workspace Placeholder */}
      <Card className="p-12">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
            <Play className="w-12 h-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">{t("editorWorkspace")}</h3>
            <p className="text-muted-foreground max-w-md mx-auto">{t("videoEditingInterface")}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelected} />
            <Button variant="primary" className="gap-2" onClick={handleUploadClick}>
              <Upload className="w-4 h-4" />
              {t("uploadVideo")}
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              {t("loadProject")}
            </Button>
          </div>
        </div>
      </Card>

      {/* Tips Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          {t("proTips")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">{t("keyboardShortcuts")}</h4>
            <p className="text-sm text-muted-foreground">{t("keyboardShortcutsDesc")}</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">{t("fileFormats")}</h4>
            <p className="text-sm text-muted-foreground">{t("fileFormatsDesc")}</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">{t("exportQuality")}</h4>
            <p className="text-sm text-muted-foreground">{t("exportQualityDesc")}</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">{t("autoSave")}</h4>
            <p className="text-sm text-muted-foreground">{t("autoSaveDesc")}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
