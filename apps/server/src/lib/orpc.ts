import { os } from "@orpc/server";
import type { AuthSession } from "../types/auth";
import type { Context } from "./context";

export const o = os.$context<Context>();
export const publicProcedure = o;

export const protectedProcedure = o.use(({ context }) => {
  const session = context.session as AuthSession | null;
  if (!session) {
    throw new Error("Unauthorized");
  }

  return {
    output: undefined,
    context: { ...context, session },
  };
});
