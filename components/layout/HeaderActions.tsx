"use client";

import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import Button from "@/components/ui/Button";
import { Bell, Settings, CheckCheck, Check, Trash2 } from "lucide-react";
import DropdownMenu from "@/components/ui/DropdownMenu";
import { NotificationBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";

interface HeaderActionsProps {
  className?: string;
  showNotifications?: boolean;
  showSettings?: boolean;
  notificationCount?: number;
}

export function HeaderActions({ 
  className, 
  showNotifications = true, 
  showSettings = true,
  notificationCount = 3 
}: HeaderActionsProps) {
  const notifications = [
    { id: 1, title: "OCR task #234 completed", unread: true },
    { id: 2, title: "Low confidence regions detected", unread: true },
    { id: 3, title: "New login from Chrome", unread: false },
  ];
  return (
    <div className={cn("flex items-center gap-3", className)} role="toolbar" aria-label="Header toolbar">
      {/* Notifications */}
      {showNotifications && (
        <DropdownMenu
          trigger={
            <NotificationBadge count={notificationCount} position="top-right">
              <Button variant="ghost" size="sm" aria-label="Notifications">
                <Bell className="w-5 h-5" />
              </Button>
            </NotificationBadge>
          }
          contentClassName="w-72"
        >
          <div className="px-2 py-1.5 text-xs text-muted-foreground">Notifications</div>
          <div className="max-h-72 overflow-auto">
            {notifications.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">No notifications</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={cn(
                  "px-2 py-2 text-sm rounded flex items-start gap-2",
                  n.unread ? "bg-accent/40" : ""
                )}>
                  <span className={cn("mt-1 inline-block w-2 h-2 rounded-full", n.unread ? "bg-primary" : "bg-border")} />
                  <span className="flex-1 text-foreground">{n.title}</span>
                  {n.unread ? <Check className="w-4 h-4 opacity-60" /> : null}
                </div>
              ))
            )}
          </div>
          <div className="border-t border-border/60 mt-1 p-1 flex gap-1">
            <Button variant="ghost" size="sm" className="flex-1" title="Mark all read">
              <CheckCheck className="w-4 h-4 mr-1" /> Mark all
            </Button>
            <Button variant="ghost" size="sm" className="flex-1" title="Clear">
              <Trash2 className="w-4 h-4 mr-1" /> Clear
            </Button>
          </div>
        </DropdownMenu>
      )}

      {/* Settings */}
      {showSettings && (
        <Button variant="ghost" size="sm" aria-label="Settings">
          <Settings className="w-5 h-5" />
        </Button>
      )}

      {/* Language Switcher */}
      <LanguageSwitcher />

      {/* Theme Toggle */}
      <ThemeToggle />
    </div>
  );
}
