"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles, FileText, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Assessment Agent",
    href: "/assessment-agent",
    icon: Sparkles,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileText,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <aside className="fixed left-0 top-0 z-50 h-screen w-64 border-r bg-card transition-colors duration-300">
      <div className="flex h-full flex-col">
        {/* Logo Section */}
        <div className="flex flex-col items-center justify-center px-6 pt-4">
          <div className="logo-container flex items-center gap-3">
            <Image
              src="/rep_logo.png"
              alt="Rep Recon Logo"
              width={40}
              height={40}
              className="logo-image object-contain"
            />
            <h1 className="text-2xl text-foreground">
              Rep Recon
            </h1>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 p-4 pt-6" aria-label="Main navigation">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors duration-200",
                    isActive ? "text-current" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="transition-colors duration-200">{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Menu, Theme Toggle and Logout at Bottom */}
        <div className="border-t pt-3">
          <UserMenu />
          <div className="flex items-center justify-between gap-2 px-4 pb-4">
            <Button
              variant="outline"
              size="default"
              className="h-9 bg-black dark:bg-white text-white dark:text-black border border-input hover:opacity-90"
              onClick={handleLogout}
              aria-label="Logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </aside>
  );
}