import { Hono } from "hono";
import { config } from "./config.js";
import { isAuthorized } from "./utils.js";

type CoolifyNotificationWebhookPayload = {
    success: boolean;
    event: string; // deployment_failed
    message: string; // Deployment failed
    applicationName: string; // my-app
    deploymentUrl: string;
};

const ntfy = new Hono();

ntfy.post("/:topic", async(c) => {
    const topic = c.req.param("topic");
    const token = c.req.query("token");

    if (!isAuthorized(token)) {
        return c.json({
            "message": "Unauthorized",
        }, 401);
    }

    const body = await c.req.json<CoolifyNotificationWebhookPayload>().catch(() => null);
    if (!body) {
        return c.json({ message: "Bad Request" }, 400);
    }

    const title = body.event;
    const message = `${body.message} for ${body.applicationName} with ${body.deploymentUrl}`;

    if (config.NTFY_USERNAME && config.NTFY_PASSWORD) {
        let res: Response;
        try {
            res = await fetch(config.NTFY_URL, {
                method: "POST",
                body: JSON.stringify({ topic, title, message }),
                headers: {
                    "Authorization": "Basic " + Buffer.from(`${config.NTFY_USERNAME}:${config.NTFY_PASSWORD}`).toString("base64"),
                    "Content-Type": "application/json",
                },
            });
        } catch (err) {
            console.error("Network error posting to ntfy", err);
            return c.json({ message: "Bad Gateway" }, 502);
        }

        if (!res.ok) {
            console.error(`Error posting to ntfy: ${res.status}`);
            return c.json({ message: "Bad Gateway" }, 502);
        }

        return c.body(null, 204);
    }

    // later with access token
    console.log("Not implemented access token branch");
    return c.json({ message: "Not Implemented" }, 501);
});

export default ntfy;
