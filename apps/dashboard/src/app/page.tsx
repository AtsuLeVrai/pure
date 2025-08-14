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
import { useId } from "react";
import AnimatedBackground from "@/components/AnimatedBackground";
import Header from "@/components/Header";
import {
  ANIMATION_VARIANTS,
  NAV_LINKS,
  SITE_INFO,
  STATS,
} from "@/utils/constants";

export default function Home() {
  const { fadeInUp, stagger } = ANIMATION_VARIANTS;

  return (
    <div className="relative min-h-screen bg-slate-900">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Header */}
      <div className="relative z-50">
        <Header />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 flex min-h-screen items-center overflow-hidden px-6 pt-32 pb-20">
        <div className="mx-auto max-w-7xl">
          <motion.div
            className="text-center"
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            <motion.div variants={fadeInUp} className="mb-8">
              <div className="relative mx-auto h-32 w-32">
                <Image
                  src="/logo.png"
                  alt="Pure Bot Logo"
                  width={128}
                  height={128}
                  className="h-full w-full object-cover shadow-2xl ring-4 ring-blue-400/30 transition-all duration-300 hover:ring-blue-400/50"
                  style={{ borderRadius: "20px" }}
                />
                <div className="absolute inset-0 rounded-[20px] bg-gradient-to-br from-blue-400/20 to-transparent" />
              </div>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="mb-6 font-bold text-5xl text-white sm:text-7xl"
            >
              {SITE_INFO.tagline.split(" ").slice(0, 3).join(" ")}
              <span className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                {" "}
                {SITE_INFO.tagline.split(" ").slice(3).join(" ")}
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mx-auto mb-8 max-w-3xl text-blue-200 text-xl"
            >
              Pure combines the best features from MEE6, Ticket Tool, DraftBot,
              and RaidProtect into one powerful bot—
              <strong className="text-white"> completely free, forever.</strong>
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <button
                type="button"
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-4 font-semibold text-lg text-white shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl"
              >
                <Bot className="h-5 w-5" />
                Add to Discord
                <ArrowRight className="h-5 w-5" />
              </button>

              <button
                type="button"
                className="cursor-pointer rounded-lg border border-blue-400 px-8 py-4 font-semibold text-blue-300 text-lg transition-all duration-200 hover:bg-blue-400/10"
              >
                View Features
              </button>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-8 sm:grid-cols-3"
            >
              <div className="text-center">
                <div className="font-bold text-3xl text-white">
                  {STATS.commandsExecuted}
                </div>
                <div className="text-blue-300">Commands Executed</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-3xl text-white">
                  {STATS.serversProtected}
                </div>
                <div className="text-blue-300">Servers Protected</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-3xl text-white">
                  {STATS.moneySaved}
                </div>
                <div className="text-blue-300">Money Saved</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id={useId()}
        className="relative z-10 bg-slate-800/50 px-6 py-20"
      >
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 font-bold text-4xl text-white">
              Everything you need, nothing you don't
            </h2>
            <p className="text-blue-200 text-xl">
              Professional Discord management without the premium price tag
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="rounded-xl border border-slate-700/50 bg-slate-800/80 p-8 transition-all duration-300 hover:border-blue-500/30"
            >
              <Shield className="mb-4 h-12 w-12 text-blue-400" />
              <h3 className="mb-4 font-bold text-2xl text-white">
                Advanced Moderation
              </h3>
              <p className="mb-6 text-blue-200">
                Complete moderation suite with anti-raid protection, auto-mod,
                and comprehensive logging
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-blue-200">
                  <Check className="h-4 w-4 text-green-400" />
                  Intelligent anti-raid detection
                </li>
                <li className="flex items-center gap-2 text-blue-200">
                  <Check className="h-4 w-4 text-green-400" />
                  Mass moderation tools
                </li>
                <li className="flex items-center gap-2 text-blue-200">
                  <Check className="h-4 w-4 text-green-400" />
                  Detailed audit logs
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="rounded-xl border border-slate-700/50 bg-slate-800/80 p-8 transition-all duration-300 hover:border-purple-500/30"
            >
              <Users className="mb-4 h-12 w-12 text-purple-400" />
              <h3 className="mb-4 font-bold text-2xl text-white">
                Professional Tickets
              </h3>
              <p className="mb-6 text-purple-200">
                Enterprise-grade ticket system with unlimited categories and
                full customization
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-purple-200">
                  <Check className="h-4 w-4 text-green-400" />
                  Unlimited ticket categories
                </li>
                <li className="flex items-center gap-2 text-purple-200">
                  <Check className="h-4 w-4 text-green-400" />
                  Auto staff assignment
                </li>
                <li className="flex items-center gap-2 text-purple-200">
                  <Check className="h-4 w-4 text-green-400" />
                  Full conversation transcripts
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="rounded-xl border border-slate-700/50 bg-slate-800/80 p-8 transition-all duration-300 hover:border-orange-500/30"
            >
              <Zap className="mb-4 h-12 w-12 text-orange-400" />
              <h3 className="mb-4 font-bold text-2xl text-white">
                Engagement & Economy
              </h3>
              <p className="mb-6 text-orange-200">
                XP system, virtual economy, and games without artificial
                restrictions
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-orange-200">
                  <Check className="h-4 w-4 text-green-400" />
                  Unlimited leveling system
                </li>
                <li className="flex items-center gap-2 text-orange-200">
                  <Check className="h-4 w-4 text-green-400" />
                  Virtual economy & games
                </li>
                <li className="flex items-center gap-2 text-orange-200">
                  <Check className="h-4 w-4 text-green-400" />
                  Custom rank cards
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Comparison (The Hilarious Section) */}
      <section id={useId()} className="bg-slate-900 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 font-bold text-4xl text-white">
              Stop paying for basic features
            </h2>
            <p className="text-blue-200 text-xl">
              Compare Pure with the "premium" competition
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {/* Pure */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="relative rounded-xl border-2 border-green-400 bg-slate-800/80 p-6 transition-all duration-300 hover:border-green-300"
            >
              <div className="-top-3 -translate-x-1/2 absolute left-1/2 transform rounded-full bg-green-400 px-4 py-1 font-bold text-black text-sm">
                BEST VALUE
              </div>
              <div className="mb-6 text-center">
                <h3 className="font-bold text-2xl text-white">Pure</h3>
                <div className="mt-2 font-bold text-4xl text-green-400">$0</div>
                <div className="text-green-200">Forever</div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-green-200">
                  <Check className="h-4 w-4 text-green-400" />
                  Full moderation suite
                </li>
                <li className="flex items-center gap-2 text-green-200">
                  <Check className="h-4 w-4 text-green-400" />
                  Unlimited tickets
                </li>
                <li className="flex items-center gap-2 text-green-200">
                  <Check className="h-4 w-4 text-green-400" />
                  Complete leveling system
                </li>
                <li className="flex items-center gap-2 text-green-200">
                  <Check className="h-4 w-4 text-green-400" />
                  Virtual economy
                </li>
                <li className="flex items-center gap-2 text-green-200">
                  <Check className="h-4 w-4 text-green-400" />
                  Custom branding
                </li>
                <li className="flex items-center gap-2 text-green-200">
                  <Check className="h-4 w-4 text-green-400" />
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
              className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-6"
            >
              <div className="mb-6 text-center">
                <h3 className="font-bold text-2xl text-white">MEE6</h3>
                <div className="mt-2 font-bold text-4xl text-red-400">
                  $11.95
                </div>
                <div className="text-slate-400">per month</div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-slate-400">
                  <Lock className="h-4 w-4 text-red-400" />
                  Basic moderation (limited)
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <X className="h-4 w-4 text-red-400" />
                  No ticket system
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Crown className="h-4 w-4 text-red-400" />
                  Leveling (premium only)
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <X className="h-4 w-4 text-red-400" />
                  No economy
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Crown className="h-4 w-4 text-red-400" />
                  Custom branding (premium)
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Crown className="h-4 w-4 text-red-400" />
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
              className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-6"
            >
              <div className="mb-6 text-center">
                <h3 className="font-bold text-2xl text-white">Ticket Tool</h3>
                <div className="mt-2 font-bold text-4xl text-red-400">
                  $4.99
                </div>
                <div className="text-slate-400">per month</div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-slate-400">
                  <X className="h-4 w-4 text-red-400" />
                  No moderation
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Crown className="h-4 w-4 text-red-400" />
                  Tickets (limited free)
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <X className="h-4 w-4 text-red-400" />
                  No leveling
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <X className="h-4 w-4 text-red-400" />
                  No economy
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Crown className="h-4 w-4 text-red-400" />
                  Branding (premium only)
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Crown className="h-4 w-4 text-red-400" />
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
              className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-6"
            >
              <div className="mb-6 text-center">
                <h3 className="font-bold text-2xl text-white">DraftBot</h3>
                <div className="mt-2 font-bold text-4xl text-red-400">
                  $3.99
                </div>
                <div className="text-slate-400">per month</div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-slate-400">
                  <Check className="h-4 w-4 text-gray-400" />
                  Basic moderation
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <X className="h-4 w-4 text-red-400" />
                  No tickets
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Crown className="h-4 w-4 text-red-400" />
                  Leveling (premium only)
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Crown className="h-4 w-4 text-red-400" />
                  Economy (premium only)
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Crown className="h-4 w-4 text-red-400" />
                  Branding (premium only)
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Crown className="h-4 w-4 text-red-400" />
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
            className="mt-12 text-center"
          >
            <div className="mx-auto max-w-2xl rounded-xl border border-green-500/30 bg-slate-800/80 p-6">
              <h3 className="mb-2 font-bold text-2xl text-white">
                Annual savings with Pure
              </h3>
              <div className="font-bold text-4xl text-green-400">
                {STATS.annualSavings}
              </div>
              <p className="mt-2 text-red-200">
                That's enough for a new graphics card instead of Discord bot
                subscriptions 🎮
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id={useId()} className="bg-slate-800/30 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 font-bold text-4xl text-white">Why Pure?</h2>
            <p className="text-blue-200 text-xl">
              Because Discord bots shouldn't cost more than Netflix
            </p>
          </motion.div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-6"
            >
              <h3 className="mb-3 font-bold text-white text-xl">
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
              className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-6"
            >
              <h3 className="mb-3 font-bold text-white text-xl">
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
              className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-6"
            >
              <h3 className="mb-3 font-bold text-white text-xl">
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
              className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-6"
            >
              <h3 className="mb-3 font-bold text-white text-xl">
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
      <section className="bg-slate-900 px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-6 font-bold text-4xl text-white">
              Ready to stop overpaying?
            </h2>
            <p className="mb-8 text-blue-200 text-xl">
              Join thousands of servers that made the switch to Pure
            </p>
            <button
              type="button"
              className="mx-auto flex cursor-pointer items-center gap-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-12 py-4 font-semibold text-white text-xl shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl"
            >
              <Bot className="h-6 w-6" />
              Add Pure to Discord
              <ArrowRight className="h-6 w-6" />
            </button>
            <p className="mt-4 text-blue-300 text-sm">
              Free forever • No credit card required • Setup in 30 seconds
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-slate-700/50 border-t bg-slate-800/30 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="mb-4 flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="Pure Bot Logo"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
                <span className="font-bold text-white text-xl">
                  {SITE_INFO.name}
                </span>
              </div>
              <p className="mb-4 max-w-md text-blue-200/70">
                {SITE_INFO.description}
              </p>
              <div className="text-blue-300/60 text-sm">
                {SITE_INFO.license} • Open Source
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="mb-4 font-semibold text-white">Product</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#features"
                    className="text-blue-200/70 transition-colors hover:text-white"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="text-blue-200/70 transition-colors hover:text-white"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    className="text-blue-200/70 transition-colors hover:text-white"
                  >
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Community */}
            <div>
              <h3 className="mb-4 font-semibold text-white">Community</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href={NAV_LINKS.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-200/70 transition-colors hover:text-white"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href={NAV_LINKS.discord}
                    className="text-blue-200/70 transition-colors hover:text-white"
                  >
                    Discord Server
                  </a>
                </li>
                <li>
                  <a
                    href={NAV_LINKS.issues}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-200/70 transition-colors hover:text-white"
                  >
                    Report Issues
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-slate-700/50 border-t pt-8">
            <div className="text-center text-blue-300/60 text-sm">
              © {new Date().getFullYear()} {SITE_INFO.name} Bot. Made with ❤️ by
              the community, for the community.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
