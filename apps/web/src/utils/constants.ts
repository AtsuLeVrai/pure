// Navigation Links
export const NAV_LINKS = {
  github: "https://github.com/AtsuLeVrai/pure",
  discord: "https://discord.gg/pure",
  issues: "https://github.com/AtsuLeVrai/pure/issues",
} as const;

// Site Information
export const SITE_INFO = {
  name: "Pure",
  tagline: "Discord bots shouldn't be locked behind paywalls",
  description:
    "The Discord bot as it should be: simple, powerful, and completely free. No paywalls, no premium tiers, no feature restrictions.",
  license: "Apache 2.0 License",
} as const;

// Statistics
export const STATS = {
  commandsExecuted: "500K+",
  serversProtected: "25K+",
  moneySaved: "$500K+",
  annualSavings: "$248+",
} as const;

// Animation Variants
export const ANIMATION_VARIANTS = {
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  },
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
} as const;
