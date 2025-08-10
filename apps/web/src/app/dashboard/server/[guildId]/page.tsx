"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  Crown,
  ExternalLink,
  MessageSquare,
  RotateCcw,
  Save,
  Settings,
  Shield,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ANIMATION_VARIANTS } from "@/utils/constants";

interface ServerManagementProps {
  params: {
    guildId: string;
  };
}

interface GuildConfig {
  prefix: string;
  level_system_enabled: boolean;
  economy_enabled: boolean;
  welcome_enabled: boolean;
  welcome_message: string | null;
  xp_rate: number;
  daily_reward: string;
  ticket_category_id: string | null;
}

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  memberCount?: number;
  config?: GuildConfig;
}

export default async function ServerManagement({
  params,
}: ServerManagementProps) {
  const { guildId } = await params;
  const router = useRouter();
  const { fadeInUp, stagger } = ANIMATION_VARIANTS;
  const [guild, setGuild] = useState<Guild | null>(null);
  const [config, setConfig] = useState<GuildConfig | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch guild data
  useEffect(() => {
    async function fetchGuild() {
      try {
        const response = await fetch(`/api/guilds/${guildId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch guild data");
        }
        const guildData = await response.json();
        setGuild(guildData);
        setConfig(guildData.config);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load guild");
        setLoading(false);
      }
    }

    fetchGuild();
  }, [guildId]);

  const updateConfig = (key: string, value: any) => {
    if (!config) return;
    setConfig((prev) => ({ ...prev!, [key]: value }));
    setHasChanges(true);
  };

  const saveChanges = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/guilds/${guildId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error("Failed to save configuration");
      }

      setHasChanges(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save configuration",
      );
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    if (!guild?.config) return;
    setConfig(guild.config);
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-blue-400">Loading guild configuration...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !guild || !config) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-red-400">
              {error || "Failed to load guild"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="initial"
          animate="animate"
          variants={stagger}
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={fadeInUp} className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 bg-slate-800/60 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-blue-400" />
            </button>

            <div className="flex items-center gap-4">
              {guild.icon && (
                <Image
                  src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                  alt={`${guild.name} icon`}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-white">{guild.name}</h1>
                <p className="text-blue-200">
                  {guild.memberCount?.toLocaleString() || "Unknown"} members •
                  Server Configuration
                </p>
              </div>
            </div>

            {hasChanges && (
              <div className="ml-auto flex items-center gap-3">
                <button
                  type="button"
                  onClick={resetChanges}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={saveChanges}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </motion.div>

          {/* Configuration Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* General Settings */}
            <motion.div variants={fadeInUp}>
              <div className="bg-slate-800/60 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Settings className="w-6 h-6 text-blue-400" />
                  <h2 className="text-xl font-bold text-white">
                    General Settings
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="command-prefix"
                      className="block text-sm font-medium text-blue-200 mb-2"
                    >
                      Command Prefix
                    </label>
                    <input
                      id="command-prefix"
                      type="text"
                      value={config.prefix}
                      onChange={(e) => updateConfig("prefix", e.target.value)}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                      placeholder="!"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="welcome-message"
                      className="block text-sm font-medium text-blue-200 mb-2"
                    >
                      Welcome Message
                    </label>
                    <textarea
                      id="welcome-message"
                      value={config.welcome_message || ""}
                      onChange={(e) =>
                        updateConfig("welcome_message", e.target.value)
                      }
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none h-20 resize-none"
                      placeholder="Welcome to {guild}, {user}!"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Use {"{guild}"} for server name and {"{user}"} for user
                      mention
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Moderation */}
            <motion.div variants={fadeInUp}>
              <div className="bg-slate-800/60 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="w-6 h-6 text-red-400" />
                  <h2 className="text-xl font-bold text-white">Moderation</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">
                        Enable Moderation
                      </h3>
                      <p className="text-slate-400 text-sm">
                        Basic moderation commands
                      </p>
                    </div>
                    <label
                      htmlFor="moderation-enabled"
                      className="relative inline-flex items-center cursor-pointer"
                    >
                      <input
                        id="moderation-enabled"
                        type="checkbox"
                        checked={true} // Always enabled for now
                        onChange={() => {}} // Disabled for now
                        disabled
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">
                        Welcome Messages
                      </h3>
                      <p className="text-slate-400 text-sm">
                        Greet new members
                      </p>
                    </div>
                    <label
                      htmlFor="welcome-enabled"
                      className="relative inline-flex items-center cursor-pointer"
                    >
                      <input
                        id="welcome-enabled"
                        type="checkbox"
                        checked={config.welcome_enabled}
                        onChange={(e) =>
                          updateConfig("welcome_enabled", e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Leveling System */}
            <motion.div variants={fadeInUp}>
              <div className="bg-slate-800/60 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                  <h2 className="text-xl font-bold text-white">
                    Leveling System
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">
                        Enable Leveling
                      </h3>
                      <p className="text-slate-400 text-sm">
                        XP and level progression
                      </p>
                    </div>
                    <label
                      htmlFor="leveling-enabled"
                      className="relative inline-flex items-center cursor-pointer"
                    >
                      <input
                        id="leveling-enabled"
                        type="checkbox"
                        checked={config.level_system_enabled}
                        onChange={(e) =>
                          updateConfig("level_system_enabled", e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                  <div>
                    <label
                      htmlFor="xp-rate-multiplier"
                      className="block text-sm font-medium text-blue-200 mb-2"
                    >
                      XP Rate Multiplier
                    </label>
                    <input
                      id="xp-rate-multiplier"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="5.0"
                      value={config.xp_rate}
                      onChange={(e) =>
                        updateConfig("xp_rate", parseFloat(e.target.value))
                      }
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Economy */}
            <motion.div variants={fadeInUp}>
              <div className="bg-slate-800/60 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Crown className="w-6 h-6 text-yellow-400" />
                  <h2 className="text-xl font-bold text-white">Economy</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">Enable Economy</h3>
                      <p className="text-slate-400 text-sm">
                        Virtual currency system
                      </p>
                    </div>
                    <label
                      htmlFor="economy-enabled"
                      className="relative inline-flex items-center cursor-pointer"
                    >
                      <input
                        id="economy-enabled"
                        type="checkbox"
                        checked={config.economy_enabled}
                        onChange={(e) =>
                          updateConfig("economy_enabled", e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                  <div>
                    <label
                      htmlFor="daily-reward-amount"
                      className="block text-sm font-medium text-blue-200 mb-2"
                    >
                      Daily Reward Amount
                    </label>
                    <input
                      id="daily-reward-amount"
                      type="number"
                      min="1"
                      value={config.daily_reward}
                      onChange={(e) =>
                        updateConfig("daily_reward", e.target.value)
                      }
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">Ticket System</h3>
                      <p className="text-slate-400 text-sm">
                        Support ticket management
                      </p>
                    </div>
                    <label
                      htmlFor="tickets-enabled"
                      className="relative inline-flex items-center cursor-pointer"
                    >
                      <input
                        id="tickets-enabled"
                        type="checkbox"
                        checked={config.ticket_category_id !== null}
                        onChange={(e) =>
                          updateConfig(
                            "ticket_category_id",
                            e.target.checked ? "placeholder" : null,
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Quick Links */}
          <motion.div variants={fadeInUp}>
            <h2 className="text-2xl font-bold text-white mb-6">
              Advanced Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Auto Moderation", icon: Activity, color: "purple" },
                {
                  title: "Custom Commands",
                  icon: MessageSquare,
                  color: "blue",
                },
                { title: "Analytics", icon: TrendingUp, color: "indigo" },
              ].map((link, index) => (
                <motion.div
                  key={link.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-slate-800/60 backdrop-blur-lg p-6 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300 group cursor-pointer"
                >
                  <div
                    className={`p-3 rounded-lg bg-${link.color}-500/20 w-fit mb-4`}
                  >
                    <link.icon className={`w-6 h-6 text-${link.color}-400`} />
                  </div>
                  <h3 className="text-white font-semibold mb-2">
                    {link.title}
                  </h3>
                  <div className="flex items-center text-blue-400 text-sm font-medium group-hover:text-blue-300 transition-colors">
                    Configure
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
