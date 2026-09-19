import type { Notification } from "../../notifiers/types.js";
import type { CoolifyWebhookPayload, UnknownCoolifyPayload } from "./types.js";
import { truncateTail } from "../../lib/utils.js";

const MAX_DETAIL_LENGTH = 500;

function withDetail(message: string, detail: string | undefined): string {
    if (!detail) {
        return message;
    }

    return `${message}\n\n${truncateTail(detail, MAX_DETAIL_LENGTH)}`;
}

function formatUnknownEvent(payload: never): Notification {
    const { event, message, url } = payload as UnknownCoolifyPayload;

    return {
        title: `Unhandled Coolify event: ${event ?? "unknown"}`,
        message: message ?? "Payload contained no message.",
        severity: "warning",
        url,
    };
}

export function formatCoolifyEvent(payload: CoolifyWebhookPayload): Notification {
    switch (payload.event) {
        case "deployment_success":
            return {
                title: `Deployment succeeded: ${payload.application_name} (${payload.environment})`,
                message: payload.message,
                severity: "info",
                url: payload.deployment_url,
            };
        case "deployment_failed":
            return {
                title: `Deployment failed: ${payload.application_name} (${payload.environment})`,
                message: payload.message,
                severity: "error",
                url: payload.deployment_url,
            };
        case "status_changed":
            return {
                title: `Status changed: ${payload.application_name} (${payload.environment})`,
                message: payload.message,
                severity: "error",
                url: payload.url,
            };
        case "restart_limit_reached":
            return {
                title: `Container restart limit reached: ${payload.application_name} (${payload.environment})`,
                message: `${payload.message}\n\nRestarts: ${payload.restart_count}/${payload.max_restart_count}`,
                severity: "error",
                url: payload.url,
            };
        case "backup_success":
            return {
                title: `Backup successful: ${payload.database_name}`,
                message: payload.message,
                severity: "info",
                url: payload.url,
            };
        case "backup_failed":
            return {
                title: `Backup failed: ${payload.database_name}`,
                message: withDetail(payload.message, payload.error_output),
                severity: "error",
                url: payload.url,
            };
        case "backup_success_with_s3_warning":
            return {
                title: `Backup successful with S3 error: ${payload.database_name}`,
                message: withDetail(payload.message, payload.s3_error),
                severity: "warning",
                url: payload.url,
            };
        case "task_success":
            return {
                title: `Scheduled task successful: ${payload.task_name}`,
                message: withDetail(payload.message, payload.output),
                severity: "info",
                url: payload.url,
            };
        case "task_failed":
            return {
                title: `Scheduled task failed: ${payload.task_name}`,
                message: withDetail(payload.message, payload.output),
                severity: "error",
                url: payload.url,
            };
        case "docker_cleanup_success":
            return {
                title: `Docker cleanup successful: ${payload.server_name}`,
                message: withDetail(payload.message, payload.cleanup_message),
                severity: "info",
                url: payload.url,
            };
        case "docker_cleanup_failed":
            return {
                title: `Docker cleanup failed: ${payload.server_name}`,
                message: withDetail(payload.message, payload.error_message),
                severity: "error",
                url: payload.url,
            };
        case "server_reachable":
            return {
                title: `Server is reachable again: ${payload.server_name}`,
                message: payload.message,
                severity: "info",
                url: payload.url,
            };
        case "server_unreachable":
            return {
                title: `Server is unreachable: ${payload.server_name}`,
                message: payload.message,
                severity: "error",
                url: payload.url,
            };
        case "high_disk_usage":
            return {
                title: `High disk usage detected: ${payload.server_name}`,
                message: `${payload.message}\n\nUsage: ${payload.disk_usage}% (threshold ${payload.threshold}%)`,
                severity: "warning",
                url: payload.url,
            };
        case "server_patch_check":
            return {
                title: `Server patches available: ${payload.server_name}`,
                message: `${payload.message}\n\nUpdates: ${payload.total_updates} (${payload.critical_packages_count} critical)`,
                severity: "info",
                url: payload.url,
            };
        case "server_patch_check_error":
            return {
                title: `Error checking available server patches: ${payload.server_name}`,
                message: withDetail(payload.message, payload.error),
                severity: "error",
                url: payload.url,
            };
        case "traefik_version_outdated": {
            const servers = payload.servers
                .map(server => {
                    const updateType = server.update_type === "minor_upgrade"
                        ? `minor${server.upgrade_target ? ` to ${server.upgrade_target}` : ""}`
                        : "patch";
                    const targets = [ `${server.latest_version} (${updateType})` ];

                    if (server.newer_branch_latest) {
                        targets.push(`${server.newer_branch_latest} (branch ${server.newer_branch_target})`);
                    }

                    return `- ${server.name}: ${server.current_version} => ${targets.join(" / ")}`;
                })
                .join("\n");

            return {
                title: `Traefik version outdated on ${payload.affected_servers_count} server(s)`,
                message: `${payload.message}\n\n${servers}`,
                severity: "warning",
            };
        }
        case "container_stopped":
            return {
                title: `Container stopped unexpectedly: ${payload.container_name} on server ${payload.server_name}`,
                message: payload.message,
                severity: "error",
                url: payload.url,
            };
        case "container_restarted":
            return {
                title: `Container was restarted: ${payload.container_name} on server ${payload.server_name}`,
                message: payload.message,
                severity: "warning",
                url: payload.url,
            };
        case "test":
            return {
                title: "Coolify test notification",
                message: payload.message,
                severity: "info",
                url: payload.url,
            };
        default:
            return formatUnknownEvent(payload);
    }
}
