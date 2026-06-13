"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, Info, AlertTriangle, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/weekly": "Weekly Plan",
  "/tomorrow": "Tomorrow Plan",
  "/watchtower": "Watchtower",
  "/map": "Map Context",
  "/competitors": "Competitor Intelligence",
  "/recommendations": "Recommendations",
  "/brief": "Manager Brief",
  "/settings": "Settings",
};

interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "error";
  read: boolean;
  created_at: string;
  link?: string;
}

function SeverityIcon({ severity }: { severity: string }) {
  switch (severity) {
    case "error":
      return <AlertCircle className="size-3.5 text-[var(--destructive)] shrink-0" />;
    case "warning":
      return <AlertTriangle className="size-3.5 text-[var(--warning)] shrink-0" />;
    default:
      return <Info className="size-3.5 text-[var(--accent)] shrink-0" />;
  }
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const title = pageTitles[pathname] ?? "SkyPulse";
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "mark_all_read" }) });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { /* ignore */ }
  };

  const handleNotificationClick = (n: AppNotification) => {
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    if (n.link) router.push(n.link);
  };

  return (
    <header className="flex items-center justify-between h-14 px-5 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl shrink-0">
      <h1 className="text-base font-semibold text-white tracking-tight">{title}</h1>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="relative flex items-center justify-center size-8 rounded-md text-[var(--muted-foreground)] hover:bg-white/[0.04] hover:text-foreground transition-colors"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-4 h-4 rounded-full bg-[var(--destructive)] text-[10px] font-medium text-white px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] text-[var(--accent)] hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="size-3" /> Mark all read
                </button>
              )}
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <ScrollArea className="max-h-80">
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className={cn("flex items-start gap-2.5 py-2.5 cursor-pointer", !n.read && "bg-[var(--primary)]/5")}
                  onClick={() => handleNotificationClick(n)}
                >
                  <SeverityIcon severity={n.severity} />
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-foreground truncate">{n.title}</span>
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{n.message}</p>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
