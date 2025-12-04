"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { MainContent } from "@/components/main-content";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isLandingPage = pathname === "/";

  if (isAuthPage || isLandingPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MainContent>{children}</MainContent>
    </div>
  );
}

