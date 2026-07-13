import { timingSafeEqual } from "node:crypto";
import { config } from "./config.js";


export function isAuthorized(queryToken: string | undefined): boolean {
    if (!queryToken) {
        return false;
    }

    const queryTokenBuffer = Buffer.from(queryToken);
    const envTokenBuffer = Buffer.from(config.RELAY_TOKEN);

    if (queryTokenBuffer.length !== envTokenBuffer.length) {
        return false;
    }

    if (!timingSafeEqual(queryTokenBuffer, envTokenBuffer)) {
        return false;
    }

    return true;
}
