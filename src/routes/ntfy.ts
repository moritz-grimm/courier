import { Hono } from "hono";
import { FORMATTERS } from "../formatters/registry.js";
import { isAuthorized } from "../lib/utils.js";
import { send } from "../notifiers/ntfy.js";

const ntfy = new Hono();

ntfy.post("/:source/:topic", async(c) => {
    const source = c.req.param("source");
    const topic = c.req.param("topic");
    const token = c.req.query("token");

    if (!isAuthorized(token)) {
        return c.json({
            "message": "Unauthorized",
        }, 401);
    }

    const body = await c.req.json<unknown>().catch(() => null);
    if (!body || typeof body !== "object") {
        return c.json({ message: "Bad Request" }, 400);
    }

    const format = FORMATTERS[source];
    if (!format) return c.body("Unknown source", 400);
    const notification = format(body);

    try {
        const res = await send(topic, notification);

        if (!res.ok) return c.body(res.message, res.status);
    } catch (err) {
        console.error("Internal Server Error", err);
        return c.body("Internal Server Error", 500);
    }

    return c.body(null, 204);
});

export default ntfy;
