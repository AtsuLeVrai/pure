"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Bot,
  ExternalLink,
  Github,
  LogIn,
  LogOut,
  Menu,
  Settings,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAV_LINKS, SITE_INFO } from "@/utils/constants";
import { orpc } from "@/utils/orpc";

export default function Header() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Check authentication status first (lightweight)
  const { data: authStatus } = useQuery({
    ...orpc.auth.status.queryOptions({ input: {} }),
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Get user data only if authenticated
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    ...orpc.auth.me.queryOptions({ input: {} }),
    enabled: authStatus?.isAuthenticated === true, // Only run if authenticated
    retry: false,
    retryOnMount: false,
  });

  const loginMutation = useMutation(orpc.auth.login.mutationOptions());
  const logoutMutation = useMutation(orpc.auth.logout.mutationOptions());

  const isAuthenticated = !!user && !error;

  const handleLogin = async () => {
    try {
      const result = await loginMutation.mutateAsync({});
      if (result?.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync({});
      // Clear all auth-related queries
      await queryClient.invalidateQueries();
      queryClient.clear();
      // Refresh the page after successful logout
      router.refresh();
      window.location.reload();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const getAvatarUrl = (userId: string, avatar: string | null, size = 32) => {
    if (!avatar) {
      return `https://cdn.discordapp.com/embed/avatars/${
        Number.parseInt(userId, 10) % 6
      }.png`;
    }
    return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.${
      avatar.startsWith("a_") ? "gif" : "png"
    }?size=${size}`;
  };

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 right-0 left-0 z-50 border-slate-700/50 border-b bg-slate-900/90 backdrop-blur-lg"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-20 w-full items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <motion.div
              className="flex flex-shrink-0 cursor-pointer items-center gap-3"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="relative">
                <Image
                  src="/logo.png"
                  alt="Pure Bot Logo"
                  width={48}
                  height={48}
                  className="rounded-full ring-2 ring-blue-400/30 transition-all duration-200 hover:ring-blue-400/50"
                />
              </div>
              <span className="font-bold text-2xl text-white transition-colors duration-200 hover:text-blue-100">
                {SITE_INFO.name}
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden flex-1 items-center justify-center gap-8 md:flex">
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="cursor-pointer border-none bg-transparent p-0 font-medium text-blue-200 transition-colors duration-200 hover:text-white"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("pricing")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="cursor-pointer border-none bg-transparent p-0 font-medium text-blue-200 transition-colors duration-200 hover:text-white"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("faq")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="cursor-pointer border-none bg-transparent p-0 font-medium text-blue-200 transition-colors duration-200 hover:text-white"
            >
              FAQ
            </button>
            <a
              href={NAV_LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex cursor-pointer items-center gap-2 font-medium text-blue-200 transition-colors duration-200 hover:text-white"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden flex-shrink-0 items-center gap-4 md:flex">
            {isLoading ? (
              <div className="h-10 w-20 animate-pulse rounded-lg bg-slate-700/50" />
            ) : isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="group flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors duration-200 hover:bg-slate-800/50"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                  aria-label="User menu"
                >
                  <Image
                    src={getAvatarUrl(user.id, user.avatar, 32)}
                    alt={`${user.username}'s avatar`}
                    width={32}
                    height={32}
                    className="rounded-full ring-2 ring-blue-400/30 transition-all duration-200 group-hover:ring-blue-400/50"
                  />
                  <span className="max-w-32 truncate font-medium text-white transition-colors duration-200 group-hover:text-blue-100">
                    {user.username}
                  </span>
                  <svg
                    aria-hidden="true"
                    className={`h-4 w-4 text-blue-200 transition-all duration-200 group-hover:text-white ${
                      isUserMenuOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-0 z-50 mt-2 w-64 rounded-lg border border-slate-700/50 bg-slate-800/95 shadow-xl backdrop-blur-lg"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    <div className="border-slate-700/50 border-b p-4">
                      <div className="flex items-center gap-3">
                        <Image
                          src={getAvatarUrl(user.id, user.avatar, 40)}
                          alt={`${user.username}'s avatar`}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <div>
                          <div className="font-semibold text-white">
                            {user.username}
                          </div>
                          <div className="text-blue-200 text-sm">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <Link
                        href="/dashboard"
                        className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-blue-200 transition-colors duration-200 hover:bg-slate-700/50 hover:text-white"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <button
                        type="button"
                        className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-blue-200 transition-colors duration-200 hover:bg-slate-700/50 hover:text-white"
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </button>
                      <hr className="my-2 border-slate-700/50" />
                      <button
                        type="button"
                        onClick={() => {
                          handleLogout();
                          setIsUserMenuOpen(false);
                        }}
                        disabled={logoutMutation.isPending}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-red-400 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogin}
                  disabled={loginMutation.isPending}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-blue-400/30 px-4 py-2 font-medium text-blue-200 transition-all duration-200 hover:border-blue-400/50 hover:text-white disabled:opacity-50"
                >
                  <LogIn className="h-4 w-4" />
                  Sign in
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-2 font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl"
                >
                  <Bot className="h-4 w-4" />
                  Add to Discord
                  <ExternalLink className="h-4 w-4" />
                </motion.button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="cursor-pointer rounded-lg p-2 text-white transition-colors duration-200 hover:bg-slate-800/50 md:hidden"
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden border-slate-700/50 border-t py-4 md:hidden"
          >
            <nav className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => {
                  document
                    .getElementById("features")
                    ?.scrollIntoView({ behavior: "smooth" });
                  setIsMenuOpen(false);
                }}
                className="w-full cursor-pointer border-none bg-transparent py-2 text-left font-medium text-blue-200 transition-colors duration-200 hover:text-white"
              >
                Features
              </button>
              <button
                type="button"
                onClick={() => {
                  document
                    .getElementById("pricing")
                    ?.scrollIntoView({ behavior: "smooth" });
                  setIsMenuOpen(false);
                }}
                className="w-full cursor-pointer border-none bg-transparent py-2 text-left font-medium text-blue-200 transition-colors duration-200 hover:text-white"
              >
                Pricing
              </button>
              <button
                type="button"
                onClick={() => {
                  document
                    .getElementById("faq")
                    ?.scrollIntoView({ behavior: "smooth" });
                  setIsMenuOpen(false);
                }}
                className="w-full cursor-pointer border-none bg-transparent py-2 text-left font-medium text-blue-200 transition-colors duration-200 hover:text-white"
              >
                FAQ
              </button>
              <a
                href="https://github.com/AtsuLeVrai/pure"
                target="_blank"
                rel="noopener noreferrer"
                className="flex cursor-pointer items-center gap-2 py-2 font-medium text-blue-200 transition-colors duration-200 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
              <div className="flex flex-col gap-3 border-slate-700/50 border-t pt-4">
                {isLoading ? (
                  <div className="h-10 animate-pulse rounded-lg bg-slate-700/50" />
                ) : isAuthenticated && user ? (
                  <>
                    <div className="flex items-center gap-3 rounded-lg bg-slate-800/50 p-3">
                      <Image
                        src={getAvatarUrl(user.id, user.avatar, 32)}
                        alt={`${user.username}'s avatar`}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <div>
                        <div className="font-medium text-white">
                          {user.username}
                        </div>
                        <div className="text-blue-200 text-sm">
                          @{user.username}
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-blue-200 transition-colors duration-200 hover:bg-slate-800/50 hover:text-white"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-blue-200 transition-colors duration-200 hover:bg-slate-800/50 hover:text-white"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      disabled={logoutMutation.isPending}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-red-400 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleLogin();
                        setIsMenuOpen(false);
                      }}
                      disabled={loginMutation.isPending}
                      className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-blue-400/30 px-4 py-2 font-medium text-blue-200 transition-all duration-200 hover:border-blue-400/50 hover:text-white"
                    >
                      <LogIn className="h-4 w-4" />
                      Sign in
                    </button>
                    <button
                      type="button"
                      className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-2 font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Bot className="h-4 w-4" />
                      Add to Discord
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
