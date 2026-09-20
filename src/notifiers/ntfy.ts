import { env } from "../env.js";
import type { Notification, NotifyResult } from "./types.js";

const SEVERITY_TO_PRIORITY: Record<Notification["severity"], number> = {
    "info": 2,
    "warning": 4,
    "error": 5,
};

export async function send(topic: string, notification: Notification): Promise<NotifyResult> {
    let res: Response;

    const auth = env.NTFY_TOKEN
        ? { "Authorization": `Bearer ${env.NTFY_TOKEN}` }
        : { "Authorization": "Basic " + Buffer.from(`${env.NTFY_USERNAME}:${env.NTFY_PASSWORD}`).toString("base64") };

    try {
        res = await fetch(env.NTFY_URL, {
            method: "POST",
            body: JSON.stringify({
                topic,
                title: notification.title,
                priority: SEVERITY_TO_PRIORITY[notification.severity],
                message: notification.message,
                click: notification.url,
            }),
            headers: {
                "Content-Type": "application/json",
                ...auth,
            },
        });
    } catch (err) {
        console.error("Network error posting to ntfy", err);
        return { ok: false, status: 502, message: "Bad Gateway" };
    }

    if (!res.ok) {
        console.error(`Error posting to ntfy: ${res.status}`);
        return { ok: false, status: 502, message: "Bad Gateway" };
    }

    return { ok: true };
}
