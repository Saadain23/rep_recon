"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Sparkles, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

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

  return (
    <aside className="fixed left-0 top-0 z-50 h-screen w-64 border-r bg-card transition-colors duration-300">
      <div className="flex h-full flex-col">
        {/* Logo Section */}
        <div className="flex flex-col items-center justify-center px-6 pt-4">
          <div className="logo-container h-36 w-auto">
            <Image
              src="/withsecure_logo.webp"
              alt="WithSecure Logo"
              width={200}
              height={56}
              className="h-36 w-80 object-contain"
              priority
            />
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

        {/* Theme Toggle at Bottom */}
        <div className="p-4">
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}