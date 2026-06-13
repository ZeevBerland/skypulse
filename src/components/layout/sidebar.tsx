"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Eye,
  Map,
  Binoculars,
  Lightbulb,
  FileText,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Cloud,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Weekly Plan", icon: Calendar, href: "/weekly" },
  { label: "Tomorrow", icon: Clock, href: "/tomorrow" },
  { label: "Watchtower", icon: Eye, href: "/watchtower" },
  { label: "Map", icon: Map, href: "/map" },
  { label: "Competitors", icon: Binoculars, href: "/competitors" },
  { label: "Recommendations", icon: Lightbulb, href: "/recommendations" },
  { label: "Manager Brief", icon: FileText, href: "/brief" },
  { label: "Settings", icon: Settings, href: "/settings" },
] as const;

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col h-screen border-r border-[var(--sidebar-border)] transition-all duration-200 ease-in-out shrink-0",
        "bg-[var(--sidebar)]/90 backdrop-blur-xl",
        collapsed ? "w-[60px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 h-14 px-4 border-b border-[var(--sidebar-border)]">
        <Cloud className="size-5 shrink-0 text-[var(--signal-blue)]" />
        {!collapsed && (
          <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
            SkyPulse
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5 py-3 px-2 overflow-y-auto">
        {navItems.map(({ label, icon: Icon, href }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-[var(--signal-blue)]/10 text-white"
                  : "text-[var(--muted-foreground)] hover:bg-white/[0.04] hover:text-[var(--foreground)]"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-sm bg-[var(--signal-blue)]" />
              )}
              <Icon className={cn(
                "size-[18px] shrink-0 transition-colors",
                active && "text-[var(--signal-blue)]"
              )} />
              {!collapsed && (
                <span className={cn("truncate", active && "font-medium")}>{label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center justify-center h-10 mx-2 mb-2 rounded-lg text-[var(--muted-foreground)] hover:bg-white/[0.04] hover:text-[var(--foreground)] transition-colors"
      >
        {collapsed ? (
          <PanelLeftOpen className="size-[18px]" />
        ) : (
          <PanelLeftClose className="size-[18px]" />
        )}
      </button>
    </aside>
  );
}
