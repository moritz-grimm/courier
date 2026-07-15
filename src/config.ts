import "dotenv/config";

export type Config = {
    PORT: number;
    RELAY_TOKEN: string;
    NTFY_URL: string;
    NTFY_TOKEN?: string;
    NTFY_USERNAME?: string;
    NTFY_PASSWORD?: string;
    RATELIMIT_WHITELIST: string[];
};

const port = Number(process.env.PORT ?? 3000);
const relayToken = process.env.RELAY_TOKEN;
const ratelimitWhitelist = process.env.RATELIMIT_WHITELIST?.split(",") || [];
const ntfyUrl = process.env.NTFY_URL;
const ntfyToken = process.env.NTFY_TOKEN;
const ntfyUsername = process.env.NTFY_USERNAME;
const ntfyPassword = process.env.NTFY_PASSWORD;

if (!relayToken || !ntfyUrl || (!ntfyToken && !(ntfyUsername && ntfyPassword))) throw new Error("Required .env property missing");
if (!Number.isInteger(port) || port <= 1024 || port >= 65553) {
    throw new Error("Invalid PORT .env configuration");
}

export const config: Config = {
    PORT: port,
    RELAY_TOKEN: relayToken,
    RATELIMIT_WHITELIST: ratelimitWhitelist,
    NTFY_URL: ntfyUrl,
    NTFY_TOKEN: ntfyToken,
    NTFY_USERNAME: ntfyUsername,
    NTFY_PASSWORD: ntfyPassword,
};
