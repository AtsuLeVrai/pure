"use client";

import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Calendar,
  ChevronRight,
  Crown,
  MessageSquare,
  Plus,
  Server,
  Shield,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ANIMATION_VARIANTS } from "@/utils/constants";
import { getAvatarUrl, getDisplayName } from "@/utils/discord";

// Mock data for demonstration
const MOCK_GUILDS = [
  {
    id: "123456789",
    name: "Gaming Central",
    icon: "https://cdn.discordapp.com/icons/123456789/a_sample_icon.png",
    memberCount: 1250,
    botInGuild: true,
    permissions: ["ADMINISTRATOR"],
  },
  {
    id: "987654321",
    name: "Code & Coffee",
    icon: null,
    memberCount: 850,
    botInGuild: true,
    permissions: ["MANAGE_GUILD", "MANAGE_CHANNELS"],
  },
  {
    id: "456789123",
    name: "Art Community",
    icon: "https://cdn.discordapp.com/icons/456789123/another_icon.png",
    memberCount: 2100,
    botInGuild: false,
    permissions: ["ADMINISTRATOR"],
  },
];

const QUICK_STATS = [
  {
    label: "Total Members",
    value: "4,200",
    change: "+12%",
    trend: "up",
    icon: Users,
    color: "blue",
  },
  {
    label: "Commands Used",
    value: "15.2K",
    change: "+8%",
    trend: "up",
    icon: Zap,
    color: "green",
  },
  {
    label: "Moderation Actions",
    value: "342",
    change: "-15%",
    trend: "down",
    icon: Shield,
    color: "red",
  },
  {
    label: "Active Servers",
    value: "2",
    change: "0%",
    trend: "neutral",
    icon: Server,
    color: "purple",
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { fadeInUp, stagger } = ANIMATION_VARIANTS;

  const getGuildIcon = (guild: (typeof MOCK_GUILDS)[0]) => {
    if (guild.icon) {
      return guild.icon;
    }
    // Discord default guild icon
    const defaultIcon = guild.name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(defaultIcon)}&background=5865f2&color=ffffff&size=128`;
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="initial"
          animate="animate"
          variants={stagger}
          className="space-y-8"
        >
          {/* Welcome Section */}
          <motion.div variants={fadeInUp} className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              {user && (
                <>
                  <Image
                    src={getAvatarUrl(user.id, user.avatar, 64)}
                    alt={`${getDisplayName(user)}'s avatar`}
                    width={64}
                    height={64}
                    className="rounded-full ring-4 ring-blue-400/30"
                  />
                  <div>
                    <h1 className="text-3xl font-bold text-white">
                      Welcome back, {getDisplayName(user)}
                    </h1>
                    <p className="text-blue-200">
                      Manage your Discord servers with Pure
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div variants={fadeInUp}>
            <h2 className="text-2xl font-bold text-white mb-6">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {QUICK_STATS.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-slate-800/60 backdrop-blur-lg p-6 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-${stat.color}-500/20`}>
                      <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        stat.trend === "up"
                          ? "text-green-400"
                          : stat.trend === "down"
                            ? "text-red-400"
                            : "text-gray-400"
                      }`}
                    >
                      {stat.change}
                    </span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white mb-1">
                      {stat.value}
                    </p>
                    <p className="text-slate-400 text-sm">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Server Management */}
          <motion.div variants={fadeInUp}>
            <h2 className="text-2xl font-bold text-white mb-6">Your Servers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MOCK_GUILDS.map((guild, index) => (
                <motion.div
                  key={guild.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-slate-800/60 backdrop-blur-lg p-6 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300 group cursor-pointer"
                  onClick={() =>
                    guild.botInGuild &&
                    router.push(`/dashboard/server/${guild.id}`)
                  }
                >
                  <div className="flex items-center gap-4 mb-4">
                    <Image
                      src={getGuildIcon(guild)}
                      alt={`${guild.name} icon`}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">{guild.name}</h3>
                      <p className="text-slate-400 text-sm">
                        {guild.memberCount.toLocaleString()} members
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {guild.botInGuild ? (
                        <>
                          <UserCheck className="w-4 h-4 text-green-400" />
                          <span className="text-green-400 text-sm font-medium">
                            Pure Active
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-orange-400" />
                          <span className="text-orange-400 text-sm font-medium">
                            Not Added
                          </span>
                        </>
                      )}
                    </div>

                    {guild.botInGuild ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/server/${guild.id}`);
                        }}
                        className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                      >
                        Manage
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add bot logic here
                        }}
                        className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add Bot
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={fadeInUp}>
            <h2 className="text-2xl font-bold text-white mb-6">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Moderation",
                  description: "Manage bans, kicks, and warnings",
                  icon: Shield,
                  color: "red",
                  href: "/dashboard/moderation",
                },
                {
                  title: "Leveling System",
                  description: "Configure XP and level rewards",
                  icon: TrendingUp,
                  color: "green",
                  href: "/dashboard/leveling",
                },
                {
                  title: "Ticket System",
                  description: "Set up support tickets",
                  icon: MessageSquare,
                  color: "blue",
                },
                {
                  title: "Economy",
                  description: "Configure currency and shop",
                  icon: Crown,
                  color: "yellow",
                },
                {
                  title: "Auto Moderation",
                  description: "Automated spam protection",
                  icon: Activity,
                  color: "purple",
                },
                {
                  title: "Analytics",
                  description: "View server statistics",
                  icon: Calendar,
                  color: "indigo",
                },
              ].map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-slate-800/60 backdrop-blur-lg p-6 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300 group cursor-pointer"
                >
                  <div
                    className={`p-3 rounded-lg bg-${action.color}-500/20 w-fit mb-4`}
                  >
                    <action.icon
                      className={`w-6 h-6 text-${action.color}-400`}
                    />
                  </div>
                  <h3 className="text-white font-semibold mb-2">
                    {action.title}
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">
                    {action.description}
                  </p>
                  <div className="flex items-center text-blue-400 text-sm font-medium group-hover:text-blue-300 transition-colors">
                    Configure
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={fadeInUp}>
            <h2 className="text-2xl font-bold text-white mb-6">
              Recent Activity
            </h2>
            <div className="bg-slate-800/60 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
              <div className="space-y-4">
                {[
                  {
                    action: "User banned",
                    details: "SpamBot#1234 was banned from Gaming Central",
                    time: "2 minutes ago",
                    type: "moderation",
                  },
                  {
                    action: "Level up",
                    details: "GamerPro reached level 25 in Code & Coffee",
                    time: "15 minutes ago",
                    type: "leveling",
                  },
                  {
                    action: "Ticket created",
                    details: "New support ticket #0042 in Gaming Central",
                    time: "1 hour ago",
                    type: "ticket",
                  },
                  {
                    action: "Economy transaction",
                    details: "DailyRewards distributed to 250 users",
                    time: "3 hours ago",
                    type: "economy",
                  },
                ].map((activity, index) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                    key={index}
                    className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.type === "moderation"
                          ? "bg-red-400"
                          : activity.type === "leveling"
                            ? "bg-green-400"
                            : activity.type === "ticket"
                              ? "bg-blue-400"
                              : "bg-yellow-400"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        {activity.action}
                      </p>
                      <p className="text-slate-400 text-sm">
                        {activity.details}
                      </p>
                    </div>
                    <span className="text-slate-500 text-sm">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
