"use client";

import { motion } from "framer-motion";
import { Bot, ExternalLink, Github, Menu, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-lg border-b border-slate-700/50"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative">
              <Image
                src="/logo.png"
                alt="Pure Bot Logo"
                width={48}
                height={48}
                className="rounded-full ring-2 ring-blue-400/30"
              />
            </div>
            <span className="text-2xl font-bold text-white">Pure</span>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-blue-200 hover:text-white transition-colors duration-200 font-medium"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-blue-200 hover:text-white transition-colors duration-200 font-medium"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="text-blue-200 hover:text-white transition-colors duration-200 font-medium"
            >
              FAQ
            </a>
            <a
              href="https://github.com/AtsuLeVrai/pure"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-200 hover:text-white transition-colors duration-200 font-medium flex items-center gap-2"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <button
              type="button"
              className="text-blue-200 hover:text-white transition-colors duration-200 font-medium"
            >
              Login
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              Add to Discord
              <ExternalLink className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white p-2"
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
            className="md:hidden border-t border-slate-700/50 py-4"
          >
            <nav className="flex flex-col gap-4">
              <a
                href="#features"
                className="text-blue-200 hover:text-white transition-colors duration-200 font-medium py-2"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-blue-200 hover:text-white transition-colors duration-200 font-medium py-2"
              >
                Pricing
              </a>
              <a
                href="#faq"
                className="text-blue-200 hover:text-white transition-colors duration-200 font-medium py-2"
              >
                FAQ
              </a>
              <a
                href="https://github.com/AtsuLeVrai/pure"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-200 hover:text-white transition-colors duration-200 font-medium py-2 flex items-center gap-2"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
              <div className="flex flex-col gap-3 pt-4 border-t border-slate-700/50">
                <button
                  type="button"
                  className="text-blue-200 hover:text-white transition-colors duration-200 font-medium text-left"
                >
                  Login
                </button>
                <button
                  type="button"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 justify-center"
                >
                  <Bot className="w-4 h-4" />
                  Add to Discord
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
