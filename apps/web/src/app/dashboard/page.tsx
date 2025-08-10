"use client";

import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Calendar,
  ChevronRight,
  Crown,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Server,
  Shield,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { env } from "@/env";
import { useAuth } from "@/hooks/useAuth";
import type { EnhancedGuild } from "@/lib/discord-api";
import { ANIMATION_VARIANTS } from "@/utils/constants";
import { getAvatarUrl, getDisplayName } from "@/utils/discord";

interface DashboardStats {
  totalServers: number;
  activeServers: number;
  totalMembers: number;
  recentActivity: number;
}

interface RecentActivity {
  id: string;
  action: string;
  level: string;
  title: string;
  description: string | null;
  timestamp: string;
  user_id: string | null;
  success: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [guilds, setGuilds] = useState<EnhancedGuild[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalServers: 0,
    activeServers: 0,
    totalMembers: 0,
    recentActivity: 0,
  });
  const [isLoadingGuilds, setIsLoadingGuilds] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    [],
  );
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch guilds from API
  const fetchGuilds = async () => {
    setIsLoadingGuilds(true);
    setError(null);

    try {
      const response = await fetch("/api/guilds", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch guilds: ${response.status}`);
      }

      const data = await response.json();
      const guildsList = data.guilds || [];
      setGuilds(guildsList);

      // Calculate stats
      const totalMembers = guildsList.reduce(
        (sum: number, guild: EnhancedGuild) =>
          sum + (guild.memberCount || guild.approximate_member_count || 0),
        0,
      );

      setStats({
        totalServers: guildsList.length,
        activeServers: guildsList.filter((g: EnhancedGuild) => g.botInGuild)
          .length,
        totalMembers,
        recentActivity: Math.floor(Math.random() * 100), // Placeholder for now
      });
    } catch (err) {
      console.error("Error fetching guilds:", err);
      setError(err instanceof Error ? err.message : "Failed to load servers");
    } finally {
      setIsLoadingGuilds(false);
    }
  };

  // Fetch recent activities from API
  const fetchRecentActivities = async () => {
    if (!guilds.length) return;

    setIsLoadingActivities(true);
    try {
      // Get activities from the first guild that has analytics
      const activeGuild = guilds.find((g) => g.botInGuild);
      if (!activeGuild) {
        setRecentActivities([]);
        return;
      }

      const response = await fetch(`/api/analytics/${activeGuild.id}?days=7`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.status}`);
      }

      const data = await response.json();
      setRecentActivities(data.recentActivity || []);
    } catch (err) {
      console.error("Error fetching activities:", err);
      setRecentActivities([]);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: loop dependency
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchGuilds();
    }
  }, [isAuthenticated, user]);

  // Fetch activities after guilds are loaded
  // biome-ignore lint/correctness/useExhaustiveDependencies: loop dependency
  useEffect(() => {
    if (guilds.length > 0) {
      fetchRecentActivities();
    }
  }, [guilds]);

  const getGuildIcon = (guild: EnhancedGuild) => {
    if (guild.icon) {
      return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${
        guild.icon.startsWith("a_") ? "gif" : "png"
      }?size=64`;
    }
    return null;
  };

  const getGuildInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAddBot = (guildId: string) => {
    // Discord bot invite URL with proper permissions
    const clientId = env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const permissions = "8"; // Administrator permission
    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&guild_id=${guildId}&response_type=code&redirect_uri=${encodeURIComponent(`${window.location.origin}/api/auth/callback`)}&scope=bot%20applications.commands`;

    window.open(inviteUrl, "_blank");
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-24 pb-12">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                src={getAvatarUrl(user.id, user.avatar, 64)}
                alt={`${getDisplayName(user)}'s avatar`}
                width={64}
                height={64}
                className="rounded-full ring-2 ring-blue-400/30"
              />
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Welcome back, {getDisplayName(user)}!
                </h1>
                <p className="text-blue-200 mt-1">
                  Manage your Discord servers with Pure Bot
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fetchGuilds}
                disabled={isLoadingGuilds}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoadingGuilds ? "animate-spin" : ""}`}
                />
                Refresh Servers
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {[
            {
              label: "Total Servers",
              value: stats.totalServers,
              icon: Server,
              color: "blue",
            },
            {
              label: "Active Servers",
              value: stats.activeServers,
              icon: Zap,
              color: "green",
            },
            {
              label: "Total Members",
              value: stats.totalMembers.toLocaleString(),
              icon: Users,
              color: "purple",
            },
            {
              label: "Recent Activity",
              value: `${stats.recentActivity}%`,
              icon: TrendingUp,
              color: "orange",
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                variants={ANIMATION_VARIANTS.slideUp}
                initial="initial"
                animate="animate"
                transition={{ delay: index * 0.1 }}
                className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-lg bg-${stat.color}-500/20 text-${stat.color}-400`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Servers Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Server className="w-6 h-6 text-blue-400" />
              Your Servers
            </h2>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {isLoadingGuilds ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                <p className="text-slate-400">Loading your servers...</p>
              </div>
            </div>
          ) : guilds.length === 0 ? (
            <div className="text-center py-12">
              <Server className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No servers found
              </h3>
              <p className="text-slate-400 mb-6">
                You don't have any servers with management permissions, or Pure
                Bot hasn't been added yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {guilds.map((guild, index) => (
                <motion.div
                  key={guild.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-slate-700/50 border border-slate-600/50 rounded-lg p-4 hover:bg-slate-700/70 transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getGuildIcon(guild) ? (
                        <Image
                          src={getGuildIcon(guild)!}
                          alt={`${guild.name} icon`}
                          width={48}
                          height={48}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {getGuildInitials(guild.name)}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">
                          {guild.name}
                        </h3>
                        <p className="text-sm text-slate-400">
                          {(
                            guild.memberCount ||
                            guild.approximate_member_count ||
                            0
                          ).toLocaleString()}{" "}
                          members
                        </p>
                      </div>
                    </div>
                    {guild.botInGuild && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-green-400">
                          <UserCheck className="w-4 h-4" />
                          <span className="text-xs font-medium">Active</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      {guild.channelCount !== undefined ? (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{guild.channelCount} channels</span>
                        </div>
                      ) : null}
                      <div className="flex items-center gap-1">
                        <Crown className="w-4 h-4" />
                        <span>{guild.owner ? "Owner" : "Admin"}</span>
                      </div>
                    </div>

                    {guild.botInGuild ? (
                      <Link
                        href={`/dashboard/server/${guild.id}`}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-md transition-colors duration-200 text-sm font-medium group-hover:bg-blue-600 group-hover:text-white"
                      >
                        Manage
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddBot(guild.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 rounded-md transition-colors duration-200 text-sm font-medium hover:bg-orange-600 hover:text-white"
                      >
                        <Plus className="w-4 h-4" />
                        Add Bot
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6"
        >
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
            <Activity className="w-6 h-6 text-green-400" />
            Recent Activity
          </h2>

          {isLoadingActivities ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-slate-400">Loading activities...</span>
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                No recent activity
              </h3>
              <p className="text-slate-400">
                Activity will appear here as your bot performs actions in your
                servers.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivities.slice(0, 5).map((activity) => {
                const getActivityIcon = (action: string) => {
                  switch (action.toLowerCase()) {
                    case "moderation":
                      return Shield;
                    case "login":
                    case "logout":
                      return UserCheck;
                    case "message":
                      return MessageSquare;
                    case "command":
                      return Activity;
                    default:
                      return Activity;
                  }
                };

                const Icon = getActivityIcon(activity.action);

                const formatTimeAgo = (timestamp: string) => {
                  const now = new Date();
                  const activityTime = new Date(timestamp);
                  const diffInMs = now.getTime() - activityTime.getTime();
                  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
                  const diffInDays = Math.floor(diffInHours / 24);

                  if (diffInDays > 0) {
                    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
                  }
                  if (diffInHours > 0) {
                    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
                  }
                  return "Just now";
                };

                return (
                  <div
                    key={activity.id}
                    className={`flex items-center gap-4 p-3 rounded-lg ${
                      activity.success ? "bg-slate-700/30" : "bg-red-900/20"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        activity.success ? "bg-slate-600" : "bg-red-800"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          activity.success ? "text-slate-300" : "text-red-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{activity.title}</p>
                      <p className="text-slate-400 text-sm">
                        {activity.description || `${activity.action} action`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-sm">
                      <Calendar className="w-4 h-4" />
                      {formatTimeAgo(activity.timestamp)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
