import type { NextConfig } from "next";

export default {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
    ],
  },
} satisfies NextConfig;
