import "dotenv/config";

export type Config = {
    RELAY_TOKEN: string;
    NTFY_URL: string;
    NTFY_TOKEN?: string;
    NTFY_USERNAME?: string;
    NTFY_PASSWORD?: string;
    RATELIMIT_WHITELIST: string[];
};

const relayToken = process.env.RELAY_TOKEN;
const ratelimitWhitelist = process.env.RATELIMIT_WHITELIST?.split(",") || [];
const ntfyUrl = process.env.NTFY_URL;
const ntfyToken = process.env.NTFY_TOKEN;
const ntfyUsername = process.env.NTFY_USERNAME;
const ntfyPassword = process.env.NTFY_PASSWORD;

if (!relayToken || !ntfyUrl || (!ntfyToken && !(ntfyUsername && ntfyPassword))) throw new Error("Required .env property missing");

export const config: Config = {
    RELAY_TOKEN: relayToken,
    RATELIMIT_WHITELIST: ratelimitWhitelist,
    NTFY_URL: ntfyUrl,
    NTFY_TOKEN: ntfyToken,
    NTFY_USERNAME: ntfyUsername,
    NTFY_PASSWORD: ntfyPassword,
};
