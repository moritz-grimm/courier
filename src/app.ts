import { Hono } from "hono";
import { rateLimiter } from "hono-throttle";
import { env } from "./env.js";
import health from "./routes/health.js";
import ntfy from "./routes/ntfy.js";

const app = new Hono();

app.use(rateLimiter({
    maxRequests: 100,
    windowMs: 15 * 60 * 1000,
    whitelist: env.RATELIMIT_WHITELIST,
}));

app.route("/ntfy", ntfy);
app.route("/health", health);

export default app;
