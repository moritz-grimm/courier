import type { ContentfulStatusCode } from "hono/utils/http-status";

type Severity = "info" | "warning" | "error";

export type Notification = {
    title: string;
    message: string;
    severity: Severity;
    /** Link back to the resource in the source system, if the payload has one. */
    url?: string;
};

export type NotifyResult =
    | { ok: true }
    | { ok: false; status: ContentfulStatusCode; message: string };
