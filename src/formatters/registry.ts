import type { Notification } from "../notifiers/types.js";
import { formatCoolifyEvent } from "./coolify/coolify.js";
import type { CoolifyWebhookPayload } from "./coolify/types.js";

export const FORMATTERS: Record<string, (body: unknown) => Notification> = {
    coolify: body => formatCoolifyEvent(body as CoolifyWebhookPayload),
};
