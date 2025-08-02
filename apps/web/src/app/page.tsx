"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Check,
  Crown,
  Lock,
  Shield,
  Users,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Header from "@/components/Header";

export default function Home() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-32 pb-20 min-h-screen flex items-center bg-slate-900">
        <div className="mx-auto max-w-7xl">
          <motion.div
            className="text-center"
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            <motion.div variants={fadeInUp} className="mb-8">
              <div className="mx-auto w-32 h-32 relative">
                <Image
                  src="/logo.png"
                  alt="Pure Bot Logo"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover shadow-2xl ring-4 ring-blue-400/30 hover:ring-blue-400/50 transition-all duration-300"
                  style={{ borderRadius: "20px" }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent rounded-[20px]" />
              </div>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl sm:text-7xl font-bold text-white mb-6"
            >
              Discord bots shouldn't be
              <span className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                {" "}
                locked behind paywalls
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl text-blue-200 mb-8 max-w-3xl mx-auto"
            >
              Pure combines the best features from MEE6, Ticket Tool, DraftBot,
              and RaidProtect into one powerful bot—
              <strong className="text-white"> completely free, forever.</strong>
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <button
                type="button"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Bot className="w-5 h-5" />
                Add to Discord
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                type="button"
                className="border border-blue-400 text-blue-300 hover:bg-blue-400/10 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200"
              >
                View Features
              </button>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto"
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-white">500K+</div>
                <div className="text-blue-300">Commands Executed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">25K+</div>
                <div className="text-blue-300">Servers Protected</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">$500K+</div>
                <div className="text-blue-300">Money Saved</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-slate-800/50">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything you need, nothing you don't
            </h2>
            <p className="text-xl text-blue-200">
              Professional Discord management without the premium price tag
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-slate-800/80 p-8 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300"
            >
              <Shield className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">
                Advanced Moderation
              </h3>
              <p className="text-blue-200 mb-6">
                Complete moderation suite with anti-raid protection, auto-mod,
                and comprehensive logging
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-blue-200">
                  <Check className="w-4 h-4 text-green-400" />
                  Intelligent anti-raid detection
                </li>
                <li className="flex items-center gap-2 text-blue-200">
                  <Check className="w-4 h-4 text-green-400" />
                  Mass moderation tools
                </li>
                <li className="flex items-center gap-2 text-blue-200">
                  <Check className="w-4 h-4 text-green-400" />
                  Detailed audit logs
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-slate-800/80 p-8 rounded-xl border border-slate-700/50 hover:border-purple-500/30 transition-all duration-300"
            >
              <Users className="w-12 h-12 text-purple-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">
                Professional Tickets
              </h3>
              <p className="text-purple-200 mb-6">
                Enterprise-grade ticket system with unlimited categories and
                full customization
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-purple-200">
                  <Check className="w-4 h-4 text-green-400" />
                  Unlimited ticket categories
                </li>
                <li className="flex items-center gap-2 text-purple-200">
                  <Check className="w-4 h-4 text-green-400" />
                  Auto staff assignment
                </li>
                <li className="flex items-center gap-2 text-purple-200">
                  <Check className="w-4 h-4 text-green-400" />
                  Full conversation transcripts
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-slate-800/80 p-8 rounded-xl border border-slate-700/50 hover:border-orange-500/30 transition-all duration-300"
            >
              <Zap className="w-12 h-12 text-orange-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">
                Engagement & Economy
              </h3>
              <p className="text-orange-200 mb-6">
                XP system, virtual economy, and games without artificial
                restrictions
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-orange-200">
                  <Check className="w-4 h-4 text-green-400" />
                  Unlimited leveling system
                </li>
                <li className="flex items-center gap-2 text-orange-200">
                  <Check className="w-4 h-4 text-green-400" />
                  Virtual economy & games
                </li>
                <li className="flex items-center gap-2 text-orange-200">
                  <Check className="w-4 h-4 text-green-400" />
                  Custom rank cards
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Comparison (The Hilarious Section) */}
      <section id="pricing" className="py-20 px-6 bg-slate-900">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Stop paying for basic features
            </h2>
            <p className="text-xl text-blue-200">
              Compare Pure with the "premium" competition
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Pure */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-slate-800/80 p-6 rounded-xl border-2 border-green-400 relative hover:border-green-300 transition-all duration-300"
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-400 text-black px-4 py-1 rounded-full text-sm font-bold">
                BEST VALUE
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white">Pure</h3>
                <div className="text-4xl font-bold text-green-400 mt-2">$0</div>
                <div className="text-green-200">Forever</div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-green-200">
                  <Check className="w-4 h-4 text-green-400" />
                  Full moderation suite
                </li>
                <li className="flex items-center gap-2 text-green-200">
                  <Check className="w-4 h-4 text-green-400" />
                  Unlimited tickets
                </li>
                <li className="flex items-center gap-2 text-green-200">
                  <Check className="w-4 h-4 text-green-400" />
                  Complete leveling system
                </li>
                <li className="flex items-center gap-2 text-green-200">
                  <Check className="w-4 h-4 text-green-400" />
                  Virtual economy
                </li>
                <li className="flex items-center gap-2 text-green-200">
                  <Check className="w-4 h-4 text-green-400" />
                  Custom branding
                </li>
                <li className="flex items-center gap-2 text-green-200">
                  <Check className="w-4 h-4 text-green-400" />
                  Priority support
                </li>
              </ul>
            </motion.div>

            {/* MEE6 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-slate-800/60 p-6 rounded-xl border border-slate-700/50"
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white">MEE6</h3>
                <div className="text-4xl font-bold text-red-400 mt-2">
                  $11.95
                </div>
                <div className="text-slate-400">per month</div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-slate-400">
                  <Lock className="w-4 h-4 text-red-400" />
                  Basic moderation (limited)
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <X className="w-4 h-4 text-red-400" />
                  No ticket system
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Crown className="w-4 h-4 text-red-400" />
                  Leveling (premium only)
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <X className="w-4 h-4 text-red-400" />
                  No economy
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Crown className="w-4 h-4 text-red-400" />
                  Custom branding (premium)
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Crown className="w-4 h-4 text-red-400" />
                  Support (premium only)
                </li>
              </ul>
            </motion.div>

            {/* Ticket Tool */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-slate-800/60 p-6 rounded-xl border border-slate-700/50"
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white">Ticket Tool</h3>
                <div className="text-4xl font-bold text-red-400 mt-2">
                  $4.99
                </div>
                <div className="text-slate-400">per month</div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-slate-400">
                  <X className="w-4 h-4 text-red-400" />
                  No moderation
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Crown className="w-4 h-4 text-red-400" />
                  Tickets (limited free)
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <X className="w-4 h-4 text-red-400" />
                  No leveling
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <X className="w-4 h-4 text-red-400" />
                  No economy
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Crown className="w-4 h-4 text-red-400" />
                  Branding (premium only)
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Crown className="w-4 h-4 text-red-400" />
                  Support (premium only)
                </li>
              </ul>
            </motion.div>

            {/* DraftBot */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-slate-800/60 p-6 rounded-xl border border-slate-700/50"
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white">DraftBot</h3>
                <div className="text-4xl font-bold text-red-400 mt-2">
                  $3.99
                </div>
                <div className="text-slate-400">per month</div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-slate-400">
                  <Check className="w-4 h-4 text-gray-400" />
                  Basic moderation
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <X className="w-4 h-4 text-red-400" />
                  No tickets
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Crown className="w-4 h-4 text-red-400" />
                  Leveling (premium only)
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Crown className="w-4 h-4 text-red-400" />
                  Economy (premium only)
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Crown className="w-4 h-4 text-red-400" />
                  Branding (premium only)
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Crown className="w-4 h-4 text-red-400" />
                  Support (premium only)
                </li>
              </ul>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <div className="bg-slate-800/80 p-6 rounded-xl border border-green-500/30 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-2">
                Annual savings with Pure
              </h3>
              <div className="text-4xl font-bold text-green-400">$248+</div>
              <p className="text-red-200 mt-2">
                That's enough for a new graphics card instead of Discord bot
                subscriptions 🎮
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 bg-slate-800/30">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Why Pure?</h2>
            <p className="text-xl text-blue-200">
              Because Discord bots shouldn't cost more than Netflix
            </p>
          </motion.div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-slate-800/60 p-6 rounded-xl border border-slate-700/50"
            >
              <h3 className="text-xl font-bold text-white mb-3">
                How is Pure completely free?
              </h3>
              <p className="text-blue-200">
                Pure is open-source and community-driven. We believe essential
                Discord features should be accessible to everyone, not locked
                behind artificial paywalls. The bot is funded by the community,
                for the community.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-slate-800/60 p-6 rounded-xl border border-slate-700/50"
            >
              <h3 className="text-xl font-bold text-white mb-3">
                What's the catch?
              </h3>
              <p className="text-blue-200">
                There isn't one. No premium tiers, no feature restrictions, no
                ads. Pure gives you everything that other bots charge for,
                completely free. Our only goal is making Discord management
                accessible to everyone.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-slate-800/60 p-6 rounded-xl border border-slate-700/50"
            >
              <h3 className="text-xl font-bold text-white mb-3">
                Can Pure really replace multiple premium bots?
              </h3>
              <p className="text-blue-200">
                Absolutely. Pure combines moderation (MEE6 Premium), tickets
                (Ticket Tool Premium), leveling (DraftBot Premium), and
                anti-raid (RaidProtect Premium) into one comprehensive solution.
                Why pay $20+/month for multiple bots when you can get everything
                for $0?
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-slate-800/60 p-6 rounded-xl border border-slate-700/50"
            >
              <h3 className="text-xl font-bold text-white mb-3">
                Is Pure reliable for large servers?
              </h3>
              <p className="text-blue-200">
                Pure is designed for enterprise-grade deployments and can handle
                100,000+ member servers. Built with the same infrastructure
                standards as premium bots, but without the premium price tag.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 px-6 bg-slate-900">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to stop overpaying?
            </h2>
            <p className="text-xl text-blue-200 mb-8">
              Join thousands of servers that made the switch to Pure
            </p>
            <button
              type="button"
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-12 py-4 rounded-lg font-semibold text-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-3 mx-auto"
            >
              <Bot className="w-6 h-6" />
              Add Pure to Discord
              <ArrowRight className="w-6 h-6" />
            </button>
            <p className="text-sm text-blue-300 mt-4">
              Free forever • No credit card required • Setup in 30 seconds
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-16 px-6 bg-slate-800/30">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/logo.png"
                  alt="Pure Bot Logo"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
                <span className="text-white font-bold text-xl">Pure</span>
              </div>
              <p className="text-blue-200/70 mb-4 max-w-md">
                The Discord bot as it should be: simple, powerful, and
                completely free. No paywalls, no premium tiers, no feature
                restrictions.
              </p>
              <div className="text-sm text-blue-300/60">
                Apache 2.0 License • Open Source
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#features"
                    className="text-blue-200/70 hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="text-blue-200/70 hover:text-white transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    className="text-blue-200/70 hover:text-white transition-colors"
                  >
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Community */}
            <div>
              <h3 className="text-white font-semibold mb-4">Community</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://github.com/AtsuLeVrai/pure"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-200/70 hover:text-white transition-colors"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://discord.gg/pure"
                    className="text-blue-200/70 hover:text-white transition-colors"
                  >
                    Discord Server
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/AtsuLeVrai/pure/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-200/70 hover:text-white transition-colors"
                  >
                    Report Issues
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700/50 pt-8">
            <div className="text-center text-blue-300/60 text-sm">
              © 2024 Pure Bot. Made with ❤️ by the community, for the community.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
