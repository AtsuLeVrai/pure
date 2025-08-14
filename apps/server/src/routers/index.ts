import { publicProcedure } from "../lib/orpc";
import { authRouter } from "./auth";
import { discordRouter } from "./discord";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),

  auth: authRouter,
  discord: discordRouter,
};

export type AppRouter = typeof appRouter;
