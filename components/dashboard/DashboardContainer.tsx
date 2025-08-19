"use client";

import { useState } from "react";
import { BarChart3, Video, Clock, TrendingUp, Play, Plus, Calendar, Users, Crown, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import { Progress } from "@/components/ui/Progress";

export default function DashboardContainer() {
  const [role] = useState<string>("standard");
  const t = useTranslations("Common");

  const stats = {
    totalProjects: 8,
    completedProjects: 5,
    processingProjects: 2,
    storageUsed: 45, // %
  };

  const quickActions = [
    {
      titleKey: "createNewProject",
      descriptionKey: "startNewProject",
      icon: Plus,
      color: "bg-primary/10 text-primary",
    },
    {
      titleKey: "uploadVideo",
      descriptionKey: "uploadVideoDescription",
      icon: Video,
      color: "bg-success/10 text-success",
    },
    {
      titleKey: "openEditor",
      descriptionKey: "openEditorDescription",
      icon: Play,
      color: "bg-info/10 text-info",
    },
  ];

  const isVip = role === "vip";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            {t("dashboardTitle")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("manageVideoProjects")}</p>
        </div>
        <div className="flex gap-3">
          <Link href="./video-tasks">
            <Button variant="outline" className="gap-2">
              <Video className="w-4 h-4" />
              {t("videoTasks")}
            </Button>
          </Link>
          <Link href="./editor">
            <Button variant="primary" className="gap-2">
              <Play className="w-4 h-4" />
              {t("openEditor")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Welcome Banner */}
      <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20" hoverable>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Video className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">
              {t("welcome")} {t("videoEditor")}
            </h2>
            <p className="text-muted-foreground mt-1">{t("startByUploadingVideo")}</p>
          </div>
          <Link href="./video-tasks">
            <Button variant="primary" className="gap-2">
              <Plus className="w-4 h-4" />
              {t("createNewProject")}
            </Button>
          </Link>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6" hoverable>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Video className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("totalProjects")}</p>
              <p className="text-2xl font-bold">{stats.totalProjects}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6" hoverable>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-success/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("completedProjects")}</p>
              <p className="text-2xl font-bold">{stats.completedProjects}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6" hoverable>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-warning/10 rounded-lg">
              <Clock className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("processingProjects")}</p>
              <p className="text-2xl font-bold">{stats.processingProjects}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6" hoverable>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-info/10 rounded-lg">
              <Users className="w-6 h-6 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("storageUsed")}</p>
              <p className="text-2xl font-bold">{stats.storageUsed}GB</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{t("quickActions")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Card key={index} className="p-6 cursor-pointer group" hoverable clickable>
              <div className="text-center space-y-4">
                <div
                  className={`w-12 h-12 mx-auto ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <action.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{t(action.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{t(action.descriptionKey)}</p>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  {t(action.titleKey)}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Projects */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">{t("videoProjects")}</h2>
          <Link href="./video-tasks">
            <Button variant="ghost" size="sm">
              {t("viewDetails")}
            </Button>
          </Link>
        </div>

        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center mb-4">
            <Video className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t("noProjectsFound")}</h3>
          <p className="text-muted-foreground mb-4">{t("createFirstProject")}</p>
          <Link href="./video-tasks">
            <Button variant="primary" className="gap-2">
              <Plus className="w-4 h-4" />
              {t("createFirstVideoProject")}
            </Button>
          </Link>
        </div>
      </Card>

      {/* Account Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            {t("subscription")}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("status")}</span>
              <Badge variant={isVip ? "gradient" : "outline"} size="sm">
                {isVip ? t("vipUser") : t("standardUser")}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("role")}</span>
              <Badge variant="info" size="sm">
                {role}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("storageUsed")}</span>
              <Badge variant="outline" size="sm">
                {stats.storageUsed}GB / 10GB
              </Badge>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Storage</span>
                <span className="font-medium">{stats.storageUsed}%</span>
              </div>
              <Progress value={stats.storageUsed} className="h-2" />
            </div>
          </div>
          {!isVip && (
            <div className="mt-4 pt-4 border-t border-border">
              <Link href="./plans">
                <Button variant="primary" size="sm" className="w-full gap-2">
                  <Zap className="w-4 h-4" />
                  {t("upgradeToVIP")}
                </Button>
              </Link>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {t("recentActivity")}
          </h3>
          <div className="space-y-3">
            {/* Mock activity items with beautiful badges */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Avatar src="" fallback="JD" size="sm" />
              <div className="flex-1">
                <p className="text-sm font-medium">Project "Summer Vibes" completed</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
              <Badge variant="success" size="xs">
                Completed
              </Badge>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Avatar src="" fallback="AI" size="sm" />
              <div className="flex-1">
                <p className="text-sm font-medium">Video export started</p>
                <p className="text-xs text-muted-foreground">5 hours ago</p>
              </div>
              <Badge variant="warning" size="xs" pulse>
                Processing
              </Badge>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Avatar src="" fallback="UP" size="sm" />
              <div className="flex-1">
                <p className="text-sm font-medium">New video uploaded</p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
              <Badge variant="info" size="xs">
                Upload
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
