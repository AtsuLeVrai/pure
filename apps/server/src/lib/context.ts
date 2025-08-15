import type { Context as HonoContext } from "hono";
import type { AuthSession } from "@/types/auth";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
  const session = context.get("session") as AuthSession | null;

  return {
    session,
    context,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
