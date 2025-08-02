"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowLeftRight,
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
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
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
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

type SidebarPosition = "left" | "right";

interface DashboardSidebarProps {
  children: React.ReactNode;
}

export default function DashboardSidebar({ children }: DashboardSidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [position, setPosition] = useState<SidebarPosition>("left");

  // Load preferences from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebar-collapsed");
    const savedPosition = localStorage.getItem(
      "sidebar-position",
    ) as SidebarPosition;

    if (savedCollapsed !== null) {
      setIsCollapsed(JSON.parse(savedCollapsed));
    }
    if (savedPosition) {
      setPosition(savedPosition);
    }
  }, []);

  // Save preferences to localStorage
  const toggleCollapsed = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    localStorage.setItem("sidebar-collapsed", JSON.stringify(newCollapsed));
  };

  const togglePosition = () => {
    const newPosition = position === "left" ? "right" : "left";
    setPosition(newPosition);
    localStorage.setItem("sidebar-position", newPosition);
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const sidebarWidth = isCollapsed ? "w-16" : "w-64";
  const sidebarPosition = position === "left" ? "left-0" : "right-0";
  const contentMargin =
    position === "left"
      ? isCollapsed
        ? "ml-16"
        : "ml-64"
      : isCollapsed
        ? "mr-16"
        : "mr-64";

  return (
    <div className="min-h-screen bg-slate-900 relative flex">
      {/* Sidebar */}
      <motion.div
        className={`fixed top-0 ${sidebarPosition} h-full ${sidebarWidth} bg-slate-800/90 backdrop-blur-lg border-r border-slate-700/50 z-40 transition-all duration-300`}
        initial={false}
        animate={{ width: isCollapsed ? 64 : 256 }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">P</span>
                  </div>
                  <span className="text-white font-semibold">
                    Pure Dashboard
                  </span>
                </motion.div>
              )}

              <div className="flex items-center gap-1">
                {!isCollapsed && (
                  <button
                    type="button"
                    onClick={togglePosition}
                    className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
                    title="Switch sidebar position"
                  >
                    <ArrowLeftRight className="w-4 h-4 text-slate-400" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={toggleCollapsed}
                  className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  {position === "left" ? (
                    isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronLeft className="w-4 h-4 text-slate-400" />
                    )
                  ) : isCollapsed ? (
                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>
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
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="text-white font-medium text-sm">
                        {getDisplayName(user)}
                      </div>
                      <div className="text-slate-400 text-xs">
                        @{user.username}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                    isActive(item.href)
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="flex items-center justify-between flex-1 overflow-hidden"
                      >
                        <span className="text-sm font-medium whitespace-nowrap">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                            {item.badge}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {isCollapsed && item.badge && (
                    <div className="absolute left-8 top-1 bg-red-500 text-white text-xs rounded-full w-2 h-2"></div>
                  )}
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive(item.href)
                    ? "bg-blue-500/20 text-blue-400"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            ))}

            <button
              type="button"
              onClick={() => logout()}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                  >
                    Sign Out
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${contentMargin}`}>
        {children}
      </div>
    </div>
  );
}
