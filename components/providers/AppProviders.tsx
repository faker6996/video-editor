"use client";

import React from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/components/ui/Toast";
import { GlobalLoading } from "@/components/ui/GlobalLoading";
import { TokenRefreshProvider } from "./TokenRefreshProvider";
import { SocketProvider } from "./SocketProvider";

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Tổng hợp tất cả providers cho app
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TokenRefreshProvider>
          <SocketProvider>
            <ToastProvider position="top-right" maxToasts={5}>
              {/* Global Loading - tự động lắng nghe loading.show() / loading.hide() */}
              <GlobalLoading />
              {children}
            </ToastProvider>
          </SocketProvider>
        </TokenRefreshProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};
