import { timingSafeEqual } from "node:crypto";
import { env } from "../env.js";

export function isAuthorized(queryToken: string | undefined): boolean {
    if (!queryToken) {
        return false;
    }

    const queryTokenBuffer = Buffer.from(queryToken);
    const envTokenBuffer = Buffer.from(env.RELAY_TOKEN);

    if (queryTokenBuffer.length !== envTokenBuffer.length) {
        return false;
    }

    if (!timingSafeEqual(queryTokenBuffer, envTokenBuffer)) {
        return false;
    }

    return true;
}

export function truncateTail(text: string, max: number): string {
    if (text.length <= max) {
        return text.trim();
    }

    return `[...] ${text.slice(text.length - max).trim()}`;
}
