"use client";

import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import DropdownMenu from "@/components/ui/DropdownMenu";
import { useToast } from "@/components/ui/Toast";
import { Tooltip } from "@/components/ui/Tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { API_ROUTES } from "@/lib/constants/api-routes";
import { HTTP_METHOD_ENUM } from "@/lib/constants/enum";
import { useLocale } from "@/lib/hooks/useLocale";
import { callApi } from "@/lib/utils/api-client";
import { cn } from "@/lib/utils/cn";
import { loading } from "@/lib/utils/loading";
import { ChevronLeft, CreditCard, Crown, Eye, FileText, Home, LogOut, PlayCircle, Settings, User as UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  children?: MenuItem[];
}

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const t = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const { addToast } = useToast();

  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      label: t("home"),
      icon: Home,
      path: `/${locale}/dashboard`,
    },
    {
      id: "editor",
      label: t("videoEditor") || "Editor",
      icon: Eye,
      path: `/${locale}/editor`,
    },
    {
      id: "video-tasks",
      label: (t as any)("videoTasks") || "Video Tasks",
      icon: PlayCircle, // Thay đổi từ FolderOpen thành PlayCircle
      path: `/${locale}/video-tasks`,
    },
    {
      id: "plans",
      label: (t as any)("plans") || "Plans",
      icon: Crown, // Thay đổi từ FolderOpen thành Crown
      path: `/${locale}/plans`,
    },
    {
      id: "subscription",
      label: (t as any)("subscription") || "Subscription",
      icon: CreditCard, // Thay đổi từ FolderOpen thành CreditCard
      path: `/${locale}/subscription`,
    },
  ];

  const handleLogout = async () => {
    loading.show(t("logout") + "...");
    try {
      await callApi(API_ROUTES.AUTH.LOGOUT, HTTP_METHOD_ENUM.POST);
      logout();

      addToast({
        type: "success",
        message: t("logout") + " thành công",
      });

      router.push(`/${locale}/login`);
    } catch (error) {
      console.error("Logout failed:", error);
      addToast({
        type: "error",
        message: "Đăng xuất thất bại. Vui lòng thử lại.",
      });
    } finally {
      loading.hide();
    }
  };

  const userMenuItems = [
    {
      label: t("profile"),
      icon: UserIcon,
      onClick: () => router.push(`/${locale}/profile`),
    },
    {
      label: t("settings"),
      icon: Settings,
      onClick: () => {
        addToast({
          type: "info",
          message: "Trang cài đặt sẽ sớm ra mắt!",
        });
      },
    },
    {
      label: t("logout"),
      icon: LogOut,
      onClick: handleLogout,
      className: "text-destructive hover:text-destructive",
    },
  ];

  const toggleSidebar = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);

    // Dispatch custom event to notify layout of width change
    window.dispatchEvent(
      new CustomEvent("sidebarToggle", {
        detail: { isExpanded: newExpandedState },
      })
    );
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 h-screen border-r border-border/60 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 transition-all duration-300 ease-in-out flex flex-col",
        isExpanded ? "w-64" : "w-20",
        className
      )}
      role="navigation"
      aria-label="Primary"
    >
      {/* Header */}
      <div className="h-16 px-4 border-b border-border/60 flex items-center">
        <div className={cn("flex items-center w-full", isExpanded ? "justify-between" : "justify-end")}>
          {isExpanded && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">{t("videoEditor")}</h2>
            </div>
          )}
          {isExpanded && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4 transition-transform" />
            </Button>
          )}
          {!isExpanded && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Expand sidebar"
            >
              <ChevronLeft className="w-4 h-4 transition-transform rotate-180" />
            </Button>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2" aria-label="Primary menu">
        {menuItems.map((item) => {
          // More precise active logic
          let isActive = false;

          if (item.id === "dashboard") {
            // Dashboard is active only if exactly on dashboard page
            isActive = pathname === `/${locale}/dashboard`;
          } else if (item.id === "editor") {
            isActive = pathname.includes(`/${locale}/editor`);
          } else if (item.id === "video-tasks") {
            isActive = pathname.includes(`/${locale}/video-tasks`);
          } else if (item.id === "plans") {
            isActive = pathname.includes(`/${locale}/plans`);
          } else if (item.id === "subscription") {
            isActive = pathname.includes(`/${locale}/subscription`);
          }

          return (
            <Link
              key={item.id}
              href={item.path}
              className={cn(
                // Các class chung
                "flex items-center transition-colors group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",

                // Style cho trạng thái Active (Màu sắc)
                isActive ? "bg-accent/60 text-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",

                // Style hình dạng và kích thước dựa trên trạng thái expanded/collapsed
                isExpanded ? "gap-3 px-3 py-3 rounded-lg" : "w-10 h-10 rounded-lg justify-center mx-auto"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="flex-shrink-0">
                <item.icon className="w-5 h-5" />
              </div>
              {isExpanded ? (
                <span className="font-medium truncate">{item.label}</span>
              ) : (
                <Tooltip content={item.label} placement="right">
                  <span className="sr-only">{item.label}</span>
                </Tooltip>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Profile Section - Sticky Bottom */}
      <div className="p-4 border-t border-border mt-auto relative">
        {user ? (
          <div className="relative z-60">
            <DropdownMenu
              trigger={
                <div
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer w-full",
                    !isExpanded && "justify-center"
                  )}
                >
                  <Avatar src={user.avatar_url} size="sm" className="w-8 h-8" />
                  {isExpanded && (
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  )}
                </div>
              }
              items={userMenuItems}
              placement={isExpanded ? "top-start" : "top"}
              contentClassName="z-60"
            />
          </div>
        ) : (
          <div className={cn("flex items-center gap-3 p-3 rounded-lg animate-pulse", !isExpanded && "justify-center")}>
            <div className="w-8 h-8 bg-muted rounded-full" />
            {isExpanded && (
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-muted rounded mb-1" />
                <div className="h-3 bg-muted/60 rounded w-2/3" />
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
