type Severity = "info" | "warning" | "error";

export type Notification = {
    title: string;
    message: string;
    severity: Severity;
    /** Link back to the resource in the source system, if the payload has one. */
    url?: string;
};
