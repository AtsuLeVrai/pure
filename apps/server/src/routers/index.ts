import { o } from "@/lib/orpc";
import { authRouter } from "./auth";
import { discordRouter } from "./discord";

export const appRouter = {
  healthCheck: o.handler(() => {
    return "OK";
  }),

  auth: authRouter,
  discord: discordRouter,
} as const;

export type AppRouter = typeof appRouter;
