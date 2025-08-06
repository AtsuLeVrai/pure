"use client";

import {
  Activity,
  BarChart3,
  Bell,
  Crown,
  HelpCircle,
  Home,
  LogOut,
  MessageSquare,
  Settings,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { SITE_INFO } from "@/utils/constants";
import { getAvatarUrl, getDisplayName } from "@/utils/discord";

interface SidebarItem {
  id: string;
  label: string;
  icon: any;
  href: string;
  badge?: string;
  subItems?: SidebarItem[];
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    href: "/dashboard",
  },
  {
    id: "servers",
    label: "Servers",
    icon: Users,
    href: "/dashboard/servers",
  },
  {
    id: "moderation",
    label: "Moderation",
    icon: Shield,
    href: "/dashboard/moderation",
    badge: "3",
  },
  {
    id: "leveling",
    label: "Leveling",
    icon: TrendingUp,
    href: "/dashboard/leveling",
  },
  {
    id: "economy",
    label: "Economy",
    icon: Crown,
    href: "/dashboard/economy",
  },
  {
    id: "tickets",
    label: "Tickets",
    icon: MessageSquare,
    href: "/dashboard/tickets",
    badge: "2",
  },
  {
    id: "automod",
    label: "Auto Moderation",
    icon: Activity,
    href: "/dashboard/automod",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    href: "/dashboard/analytics",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    href: "/dashboard/notifications",
  },
];

const BOTTOM_ITEMS: SidebarItem[] = [
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
  },
  {
    id: "help",
    label: "Help & Support",
    icon: HelpCircle,
    href: "/dashboard/help",
  },
];

interface DashboardSidebarProps {
  children: React.ReactNode;
}

export default function DashboardSidebar({ children }: DashboardSidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const sidebarWidth = "w-64";
  const contentMargin = "ml-64";

  return (
    <div className="min-h-screen bg-slate-900 relative flex">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full ${sidebarWidth} bg-slate-800/90 backdrop-blur-lg border-r border-slate-700/50 z-40`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-slate-700/50">
            <Link href="/" className="cursor-pointer">
              <div className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200">
                <div className="relative">
                  <Image
                    src="/logo.png"
                    alt="Pure Bot Logo"
                    width={32}
                    height={32}
                    className="rounded-full ring-2 ring-blue-400/30 hover:ring-blue-400/50 transition-all duration-200"
                  />
                </div>
                <span className="text-xl font-bold text-white hover:text-blue-100 transition-colors duration-200">
                  {SITE_INFO.name}
                </span>
              </div>
            </Link>
          </div>

          {/* User Profile */}
          {user && (
            <div className="p-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <Image
                  src={getAvatarUrl(user.id, user.avatar, 32)}
                  alt={`${getDisplayName(user)}'s avatar`}
                  width={32}
                  height={32}
                  className="rounded-full ring-2 ring-blue-400/30"
                />
                <div>
                  <div className="text-white font-medium text-sm">
                    {getDisplayName(user)}
                  </div>
                  <div className="text-slate-400 text-xs">@{user.username}</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-3">
              {SIDEBAR_ITEMS.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group cursor-pointer ${
                    isActive(item.href)
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <div className="flex items-center justify-between flex-1">
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </nav>
          </div>

          {/* Bottom Items */}
          <div className="border-t border-slate-700/50 p-3 space-y-1">
            {BOTTOM_ITEMS.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                  isActive(item.href)
                    ? "bg-blue-500/20 text-blue-400"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}

            <button
              type="button"
              onClick={() => logout()}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${contentMargin}`}>
        {children}
      </div>
    </div>
  );
}
