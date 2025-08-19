"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "./Sidebar";
import TopHeader from "./TopHeader";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { useEffect, useState } from "react";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

const authPages = ["/login", "/register", "/forgot-password", "/reset-password"];

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default sidebar width

  // Check if current page needs authentication layout
  const isAuthPage = authPages.some((page) => pathname.includes(page));
  const showLayout = !isAuthPage && user && !loading;

  // Listen for sidebar toggle events
  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent) => {
      setSidebarWidth(event.detail.isExpanded ? 256 : 80);
    };

    window.addEventListener("sidebarToggle", handleSidebarToggle as EventListener);
    return () => {
      window.removeEventListener("sidebarToggle", handleSidebarToggle as EventListener);
    };
  }, []);

  // Generate breadcrumb items based on pathname
  const generateBreadcrumbs = () => {
    const pathSegments = pathname.split("/").filter(Boolean);
    const breadcrumbs: { label: string; href: string; isLast?: boolean }[] = [];

    // Remove locale from path
    const segments = pathSegments.slice(1); // Remove locale (vi, en, etc.)

    let currentPath = `/${pathSegments[0]}`; // Start with locale

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      const label = segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      breadcrumbs.push({
        label,
        href: currentPath,
        isLast: index === segments.length - 1,
      });
    });

    return breadcrumbs;
  };

  // Auth pages - no layout wrapper
  if (isAuthPage || loading) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  // Authenticated pages - full layout
  if (showLayout) {
    const breadcrumbs = generateBreadcrumbs();

    return (
      <div className="min-h-screen bg-background">
        {/* Fixed Header */}
        <TopHeader />

        {/* Layout Container */}
        <div className="flex">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <main className="flex-1 transition-all duration-300 ease-in-out" style={{ marginLeft: `${sidebarWidth}px` }}>
            {/* Content Container */}
            <div className="px-6 py-4 max-w-7xl mx-auto">
              {/* Breadcrumb Navigation */}
              {breadcrumbs.length > 0 && (
                <div className="mb-6">
                  <Breadcrumb items={breadcrumbs} />
                </div>
              )}

              {/* Page Content */}
              <div className="space-y-6">{children}</div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Fallback for unauthenticated users
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold">Access Denied</h1>
        <p className="text-muted-foreground">Please login to access this page</p>
      </div>
    </div>
  );
}
