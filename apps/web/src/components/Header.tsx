"use client";

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
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { NAV_LINKS, SITE_INFO } from "@/utils/constants";
import { getAvatarUrl, getDisplayName } from "@/utils/discord";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

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
      className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-lg border-b border-slate-700/50"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between h-20 w-full">
          {/* Logo */}
          <Link href="/">
            <motion.div
              className="flex items-center gap-3 cursor-pointer flex-shrink-0"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="relative">
                <Image
                  src="/logo.png"
                  alt="Pure Bot Logo"
                  width={48}
                  height={48}
                  className="rounded-full ring-2 ring-blue-400/30 hover:ring-blue-400/50 transition-all duration-200"
                />
              </div>
              <span className="text-2xl font-bold text-white hover:text-blue-100 transition-colors duration-200">
                {SITE_INFO.name}
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="text-blue-200 hover:text-white transition-colors duration-200 font-medium cursor-pointer bg-transparent border-none p-0"
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
              className="text-blue-200 hover:text-white transition-colors duration-200 font-medium cursor-pointer bg-transparent border-none p-0"
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
              className="text-blue-200 hover:text-white transition-colors duration-200 font-medium cursor-pointer bg-transparent border-none p-0"
            >
              FAQ
            </button>
            <a
              href={NAV_LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-200 hover:text-white transition-colors duration-200 font-medium flex items-center gap-2 cursor-pointer"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            {isLoading ? (
              <div className="h-10 w-20 bg-slate-700/50 rounded-lg animate-pulse" />
            ) : isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors duration-200 cursor-pointer group"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                  aria-label="User menu"
                >
                  <Image
                    src={getAvatarUrl(user.id, user.avatar, 32)}
                    alt={`${getDisplayName(user)}'s avatar`}
                    width={32}
                    height={32}
                    className="rounded-full ring-2 ring-blue-400/30 group-hover:ring-blue-400/50 transition-all duration-200"
                  />
                  <span className="text-white font-medium max-w-32 truncate group-hover:text-blue-100 transition-colors duration-200">
                    {getDisplayName(user)}
                  </span>
                  <svg
                    aria-hidden="true"
                    className={`w-4 h-4 text-blue-200 group-hover:text-white transition-all duration-200 ${
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
                    className="absolute right-0 top-full mt-2 w-64 bg-slate-800/95 backdrop-blur-lg border border-slate-700/50 rounded-lg shadow-xl z-50"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    <div className="p-4 border-b border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <Image
                          src={getAvatarUrl(user.id, user.avatar, 40)}
                          alt={`${getDisplayName(user)}'s avatar`}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <div>
                          <div className="text-white font-semibold">
                            {getDisplayName(user)}
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
                        className="w-full flex items-center gap-3 px-3 py-2 text-blue-200 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors duration-200 cursor-pointer"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Dashboard
                      </Link>
                      <button
                        type="button"
                        className="w-full flex items-center gap-3 px-3 py-2 text-blue-200 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors duration-200 cursor-pointer"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <hr className="my-2 border-slate-700/50" />
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors duration-200 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
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
                  onClick={() => login()}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-blue-200 hover:text-white border border-blue-400/30 hover:border-blue-400/50 rounded-lg font-medium transition-all duration-200 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  Sign in
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Bot className="w-4 h-4" />
                  Add to Discord
                  <ExternalLink className="w-4 h-4" />
                </motion.button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white p-2 rounded-lg hover:bg-slate-800/50 transition-colors duration-200 cursor-pointer"
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
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
            className="md:hidden border-t border-slate-700/50 py-4 overflow-hidden"
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
                className="text-blue-200 hover:text-white transition-colors duration-200 font-medium py-2 cursor-pointer bg-transparent border-none text-left w-full"
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
                className="text-blue-200 hover:text-white transition-colors duration-200 font-medium py-2 cursor-pointer bg-transparent border-none text-left w-full"
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
                className="text-blue-200 hover:text-white transition-colors duration-200 font-medium py-2 cursor-pointer bg-transparent border-none text-left w-full"
              >
                FAQ
              </button>
              <a
                href="https://github.com/AtsuLeVrai/pure"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-200 hover:text-white transition-colors duration-200 font-medium py-2 flex items-center gap-2 cursor-pointer"
                onClick={() => setIsMenuOpen(false)}
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
              <div className="flex flex-col gap-3 pt-4 border-t border-slate-700/50">
                {isLoading ? (
                  <div className="h-10 bg-slate-700/50 rounded-lg animate-pulse" />
                ) : isAuthenticated && user ? (
                  <>
                    <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                      <Image
                        src={getAvatarUrl(user.id, user.avatar, 32)}
                        alt={`${getDisplayName(user)}'s avatar`}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <div>
                        <div className="text-white font-medium">
                          {getDisplayName(user)}
                        </div>
                        <div className="text-blue-200 text-sm">
                          @{user.username}
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-blue-200 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors duration-200 cursor-pointer"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      className="flex items-center gap-2 px-4 py-2 text-blue-200 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors duration-200 cursor-pointer"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors duration-200 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        login();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-blue-200 hover:text-white border border-blue-400/30 hover:border-blue-400/50 rounded-lg font-medium transition-all duration-200 justify-center cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      Sign in
                    </button>
                    <button
                      type="button"
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 justify-center cursor-pointer"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Bot className="w-4 h-4" />
                      Add to Discord
                      <ExternalLink className="w-4 h-4" />
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
