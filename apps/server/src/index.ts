import "dotenv/config";
import { serve } from "@hono/node-server";
import { RPCHandler } from "@orpc/server/fetch";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { type RequestIdVariables, requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { trimTrailingSlash } from "hono/trailing-slash";
import { createContext } from "./lib/context";
import { jwtMiddleware } from "./middleware/jwt";
import { appRouter } from "./routers";

const app = new Hono<{
  Variables: RequestIdVariables;
}>();
const handler = new RPCHandler(appRouter);

// Define allowed origins for CORS
const origins: string[] = ["http://localhost:3000", "http://localhost:3001"];

// Middleware setup
app.use(compress());
app.use(logger());
app.use(secureHeaders());
app.use(trimTrailingSlash());
app.use("*", requestId());

// CORS middleware BEFORE CSRF for cross-origin requests
app.use(
  "/*",
  cors({
    origin: origins,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// CSRF middleware AFTER CORS - temporarily disabled for debugging
// app.use(
//   csrf({
//     origin: origins,
//   }),
// );

// Apply JWT middleware to all routes
app.use("/*", jwtMiddleware);

app.use("/rpc/*", async (c, next) => {
  const context = await createContext({ context: c });
  const { matched, response } = await handler.handle(c.req.raw, {
    prefix: "/rpc",
    context: context,
  });

  if (matched) {
    return c.newResponse(response.body, response);
  }
  await next();
});

app.get("/", (c) => {
  return c.text("OK");
});

const server = serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);

// graceful shutdown
process.on("SIGINT", () => {
  server.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  server.close((err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    process.exit(0);
  });
});
