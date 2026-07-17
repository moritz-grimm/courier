import { Hono } from "hono";
import ntfy from "./ntfy.js";
import { rateLimiter } from "hono-throttle";
import { env } from "./env.js";
import health from "./health.js";

const app = new Hono();

app.use(rateLimiter({
    maxRequests: 100,
    windowMs: 15 * 60 * 1000,
    whitelist: env.RATELIMIT_WHITELIST,
}));

app.route("/ntfy/coolify", ntfy);
app.route("/health", health);

export default app;
