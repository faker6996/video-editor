"use client";

import { useEffect, useState } from "react";
import {
  Camera,
  Calendar,
  Mail,
  Edit3,
  Settings,
  User as UserIcon,
  Shield,
  Bell,
  Key,
  Crown,
  Activity,
  Video,
  TrendingUp,
  Clock,
} from "lucide-react";
import { User } from "@/lib/models/user";
import { loadFromLocalStorage } from "@/lib/utils/local-storage";
import { callApi } from "@/lib/utils/api-client";
import { API_ROUTES } from "@/lib/constants/api-routes";
import { HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import { Avatar } from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Badge, StatusBadge, GradientBadge } from "@/components/ui/Badge";
import Progress from "@/components/ui/Progress";
import { Tooltip } from "@/components/ui/Tooltip";

export default function ProfileContainer() {
  const [user, setUser] = useState(new User());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const cachedUser = loadFromLocalStorage("user", User);
    setUser(cachedUser);

    const fetchUserData = async () => {
      try {
        const freshUser = await callApi<User>(API_ROUTES.AUTH.ME, HTTP_METHOD_ENUM.GET);
        if (freshUser) {
          setUser(freshUser);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Enhanced stats with progress indicators
  const stats = {
    videosProcessed: 15,
    totalProjects: 8,
    storageUsed: 2.4, // GB
    storageLimit: 10, // GB
    accountAge: Math.floor((Date.now() - new Date(user.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24)),
    completionRate: 85, // Percentage of completed projects
  };

  const getUserTier = () => {
    if (stats.videosProcessed >= 50) return { tier: "Pro Max", variant: "gradient" as const, icon: "👑" };
    if (stats.videosProcessed >= 20) return { tier: "Pro", variant: "primary" as const, icon: "⭐" };
    if (stats.videosProcessed >= 5) return { tier: "Active", variant: "success" as const, icon: "🚀" };
    return { tier: "Beginner", variant: "info" as const, icon: "🌱" };
  };

  const userTier = getUserTier();

  const quickActions = [
    {
      title: "Edit Profile",
      description: "Update your personal information",
      icon: Edit3,
      action: () => {},
      color: "bg-primary/10 text-primary",
      badge: "Popular",
    },
    {
      title: "Account Settings",
      description: "Manage privacy and security",
      icon: Settings,
      action: () => {},
      color: "bg-info/10 text-info",
      badge: null,
    },
    {
      title: "Notifications",
      description: "Configure alerts and emails",
      icon: Bell,
      action: () => {},
      color: "bg-warning/10 text-warning",
      badge: "3 New",
    },
    {
      title: "Security",
      description: "Password and 2FA settings",
      icon: Shield,
      action: () => {},
      color: "bg-success/10 text-success",
      badge: "Secure",
    },
  ];

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "security", label: "Security", icon: Shield },
    { id: "billing", label: "Billing", icon: Crown },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Profile Header */}
      <Card className="relative overflow-hidden">
        {/* Enhanced Cover Image */}
        <div className="h-48 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 relative">
          <div className="absolute top-4 left-4">
            <GradientBadge size="sm">
              {userTier.icon} {userTier.tier} User
            </GradientBadge>
          </div>
          <Button size="sm" variant="outline" className="absolute bottom-4 right-4 bg-background/90 hover:bg-background backdrop-blur-sm">
            <Camera className="h-4 w-4 mr-2" />
            Edit Cover
          </Button>
        </div>

        {/* Enhanced Profile Info */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              {/* Enhanced Avatar */}
              <div className="relative -mt-20">
                <Avatar src={user.avatar_url} size="lg" className="border-4 border-background shadow-lg w-32 h-32" />
                <div className="absolute -top-2 -right-2">
                  <StatusBadge status="online" size="sm">
                    Online
                  </StatusBadge>
                </div>
                <Button size="sm" variant="outline" className="absolute bottom-2 right-2 rounded-full bg-background hover:bg-muted p-2">
                  <Camera className="h-3 w-3" />
                </Button>
              </div>

              {/* Enhanced User Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-bold text-foreground">{user.name || "User"}</h1>
                  <Badge variant={userTier.variant} size="sm">
                    {userTier.icon} {userTier.tier}
                  </Badge>
                  {stats.videosProcessed > 10 && (
                    <Badge variant="gradient" size="xs" pulse>
                      🔥 Active Creator
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground">@{user.email?.split("@")[0]}</p>
                  {user.email_verified && (
                    <StatusBadge status="online" size="xs">
                      ✓ Verified
                    </StatusBadge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Joined {formatDate(user.created_at)}
                  </div>
                  <Badge variant="outline" size="xs">
                    {stats.accountAge} days active
                  </Badge>
                </div>
                {/* Activity Progress */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Activity Level:</span>
                  <Progress value={stats.completionRate} variant="success" size="sm" className="w-24" />
                  <Badge variant="success" size="xs">
                    {stats.completionRate}%
                  </Badge>
                </div>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex gap-3 mt-4 md:mt-0">
              <Button variant="primary" className="gap-2">
                <Edit3 className="h-4 w-4" />
                Edit Profile
                <Badge variant="warning" size="xs">
                  New
                </Badge>
              </Button>
              <Tooltip content="Account Settings">
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>
      </Card>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Video className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Videos Processed</p>
                <p className="text-2xl font-bold">{stats.videosProcessed}</p>
              </div>
            </div>
            {stats.videosProcessed > 10 && (
              <Badge variant="primary" size="xs">
                Pro Level
              </Badge>
            )}
          </div>
        </Card>

        <Card className="p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{stats.totalProjects}</p>
              </div>
            </div>
            <Badge variant="success" size="xs">
              +{Math.round(stats.totalProjects * 0.2)} this week
            </Badge>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-md transition-all duration-200">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning/10 rounded-lg">
                <Activity className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Storage Used</p>
                <p className="text-2xl font-bold">{stats.storageUsed}GB</p>
              </div>
            </div>
            <div className="space-y-2">
              <Progress
                value={(stats.storageUsed / stats.storageLimit) * 100}
                variant={stats.storageUsed > 7 ? "danger" : stats.storageUsed > 5 ? "warning" : "success"}
                size="sm"
              />
              <div className="flex justify-between items-center">
                <Badge variant="outline" size="xs">
                  {stats.storageLimit - stats.storageUsed}GB free
                </Badge>
                <Badge variant="info" size="xs">
                  {stats.storageLimit}GB limit
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-info/10 rounded-lg">
                <Clock className="w-6 h-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account Age</p>
                <p className="text-2xl font-bold">{stats.accountAge}d</p>
              </div>
            </div>
            {stats.accountAge > 30 && (
              <Badge variant="gradient" size="xs">
                Loyal User
              </Badge>
            )}
          </div>
        </Card>
      </div>

      {/* Enhanced Tabs */}
      <Card className="p-6">
        <div className="flex border-b border-border mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors relative ${
                activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === "billing" && (
                <Badge variant="warning" size="xs">
                  Pro
                </Badge>
              )}
              {tab.id === "security" && user.email_verified && (
                <Badge variant="success" size="xs">
                  ✓
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* Enhanced Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Enhanced Quick Actions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Quick Actions</h3>
                <Badge variant="info" size="sm">
                  4 available
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <Card key={index} className="p-4 hover:shadow-md transition-shadow cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 ${action.color} rounded-lg group-hover:scale-110 transition-transform`}>
                          <action.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">{action.title}</h4>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                      {action.badge && (
                        <Badge variant={action.badge === "Popular" ? "primary" : action.badge.includes("New") ? "warning" : "success"} size="xs">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Enhanced Account Details */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Account Details</h3>
                <StatusBadge status="online" size="sm">
                  All Good
                </StatusBadge>
              </div>
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Email</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{user.email}</span>
                      {user.email_verified && (
                        <StatusBadge status="online" size="xs">
                          ✓ Verified
                        </StatusBadge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Account Type</span>
                    </div>
                    <Badge variant={userTier.variant} size="sm">
                      {userTier.icon} {userTier.tier} User
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Email Verified</span>
                    </div>
                    <StatusBadge status={user.email_verified ? "online" : "away"} size="sm">
                      {user.email_verified ? "✓ Verified" : "⚠️ Pending"}
                    </StatusBadge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Last Updated</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{formatDate(user.updated_at)}</span>
                      <Badge variant="outline" size="xs">
                        Recent
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Settings</h3>
            <p className="text-muted-foreground mb-4">Configure your account preferences and settings</p>
            <Badge variant="info" size="sm">
              Coming Soon
            </Badge>
          </div>
        )}

        {activeTab === "security" && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Security</h3>
            <p className="text-muted-foreground mb-4">Manage your password and security settings</p>
            <div className="flex items-center justify-center gap-2">
              <StatusBadge status="online" size="sm">
                Password Strong
              </StatusBadge>
              <StatusBadge status="idle" size="sm">
                2FA Available
              </StatusBadge>
            </div>
          </div>
        )}

        {activeTab === "billing" && (
          <div className="text-center py-12">
            <Crown className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Billing</h3>
            <p className="text-muted-foreground mb-4">View your subscription and billing information</p>
            <div className="flex items-center justify-center gap-2">
              <GradientBadge size="sm">Pro Plan Active</GradientBadge>
              <Badge variant="success" size="sm">
                Next billing: Jan 2026
              </Badge>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
