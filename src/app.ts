import { Hono } from "hono";
import ntfy from "./ntfy.js";
import { rateLimiter } from "hono-throttle";
import { config } from "./config.js";

const app = new Hono();

app.use(rateLimiter({
    maxRequests: 100,
    windowMs: 15 * 60 * 1000,
    whitelist: config.RATELIMIT_WHITELIST,
}));

app.route("/ntfy/coolify", ntfy);

export default app;
