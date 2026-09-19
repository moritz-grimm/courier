/**
 * @see https://coolify.io/docs/core/notifications/channels/webhook/payload-reference
 */

/**
 * Sent when an application deployment completes successfully, or when an
 * application deployment fails. Both events carry the same structure and differ
 * only in `success` and `event`.
 *
 * Pull request preview deployments add `pull_request_id` and `preview_fqdn` to either event.
 *
 * @example
 * ```json
 * {
 *   "success": true,
 *   "event": "deployment_success",
 *   "message": "New version successfully deployed",
 *   "application_name": "my-app",
 *   "application_uuid": "...",
 *   "deployment_uuid": "...",
 *   "deployment_url": "...",
 *   "project": "...",
 *   "environment": "...",
 *   "fqdn": "..."
 * }
 * ```
 */
export type DeploymentStatusPayload = {
    "success": boolean;
    "event": "deployment_success" | "deployment_failed";
    /**
     * @example "New version successfully deployed"
     * @example "Deployment failed"
     */
    "message": string;
    /** @example "my-app" */
    "application_name": string;
    "application_uuid": string;
    "deployment_uuid": string;
    "deployment_url": string;
    "project": string;
    "environment": string;

    /**
     * Included when the application has a domain. May be absent from regular
     * and from preview deployment payloads.
     */
    "fqdn"?: string;

    /** Pull request preview deployments add this field. */
    "pull_request_id"?: number;
    /** Pull request preview deployments add this field. */
    "preview_fqdn"?: string;
};

/**
 * Sent when an application stops unexpectedly (not via a manual stop).
 *
 * @example
 * ```json
 * {
 *   "success": false,
 *   "event": "status_changed",
 *   "message": "Application stopped",
 *   "application_name": "my-app",
 *   "application_uuid": "...",
 *   "project": "...",
 *   "environment": "...",
 *   "fqdn": "...",
 *   "url": "..."
 * }
 * ```
 */
export type StatusChangePayload = {
    "success": false;
    "event": "status_changed";
    /** @example "Application stopped" */
    "message": string;
    /** @example "my-app" */
    "application_name": string;
    "application_uuid": string;
    "project": string;
    "environment": string;
    "fqdn": string;
    "url": string;
};

/**
 * Sent when Coolify stops an application after it reaches its automatic restart
 * limit. This event uses the **Container Status Changes** notification
 * selection.
 *
 * @example
 * ```json
 * {
 *   "success": false,
 *   "event": "restart_limit_reached",
 *   "message": "Restart limit reached",
 *   "application_name": "my-app",
 *   "application_uuid": "...",
 *   "restart_count": 10,
 *   "max_restart_count": 10,
 *   "url": "...",
 *   "project": "...",
 *   "environment": "...",
 *   "fqdn": "..."
 * }
 * ```
 */
export type RestartLimitReachedPayload = {
    "success": false;
    "event": "restart_limit_reached";
    /** @example "Restart limit reached" */
    "message": string;
    /** @example "my-app" */
    "application_name": string;
    "application_uuid": string;
    /** @example 10 */
    "restart_count": number;
    /** @example 10 */
    "max_restart_count": number;
    "url": string;
    "project": string;
    "environment": string;
    "fqdn": string;
};

/**
 * Sent when a database backup completes successfully.
 *
 * @example
 * ```json
 * {
 *   "success": true,
 *   "event": "backup_success",
 *   "message": "Database backup successful",
 *   "database_name": "...",
 *   "database_uuid": "...",
 *   "database_type": "...",
 *   "frequency": "...",
 *   "url": "..."
 * }
 * ```
 */
type BackupSuccessPayload = {
    "success": true;
    "event": "backup_success";
    /** @example "Database backup successful" */
    "message": string;
    "database_name": string;
    "database_uuid": string;
    "database_type": string;
    "frequency": string;
    "url": string;
};

/**
 * Sent when a database backup fails.
 *
 * @example
 * ```json
 * {
 *   "success": false,
 *   "event": "backup_failed",
 *   "message": "Database backup failed",
 *   "database_name": "...",
 *   "database_uuid": "...",
 *   "database_type": "...",
 *   "frequency": "...",
 *   "error_output": "...",
 *   "url": "..."
 * }
 * ```
 */
type BackupFailedPayload = {
    "success": false;
    "event": "backup_failed";
    /** @example "Database backup failed" */
    "message": string;
    "database_name": string;
    "database_uuid": string;
    "database_type": string;
    "frequency": string;
    "error_output": string;
    "url": string;
};

/**
 * Sent when the local backup succeeds but uploading to S3 fails.
 *
 * @example
 * ```json
 * {
 *   "success": true,
 *   "event": "backup_success_with_s3_warning",
 *   "message": "Database backup succeeded locally, S3 upload failed",
 *   "database_name": "...",
 *   "database_uuid": "...",
 *   "database_type": "...",
 *   "frequency": "...",
 *   "s3_error": "...",
 *   "s3_storage_url": "...",
 *   "url": "..."
 * }
 * ```
 */
type BackupSuccessWithS3WarningPayload = {
    "success": true;
    "event": "backup_success_with_s3_warning";
    /** @example "Database backup succeeded locally, S3 upload failed" */
    "message": string;
    "database_name": string;
    "database_uuid": string;
    "database_type": string;
    "frequency": string;
    "s3_error": string;
    /** Only present when the S3 storage URL is available. */
    "s3_storage_url"?: string;
    "url": string;
};

/**
 * Sent when a database backup completes successfully, when a database backup
 * fails, or when the local backup succeeds but uploading to S3 fails.
 */
export type BackupStatusPayload =
    | BackupSuccessPayload
    | BackupFailedPayload
    | BackupSuccessWithS3WarningPayload;

/**
 * Sent when a scheduled task completes successfully or when it fails.
 *
 * @example
 * ```json
 * {
 *   "success": true,
 *   "event": "task_success",
 *   "message": "Scheduled task succeeded",
 *   "task_name": "...",
 *   "task_uuid": "...",
 *   "output": "...",
 *   "application_uuid": "...",
 *   "url": "..."
 * }
 * ```
 */
export type TaskStatusPayload = {
    "success": boolean;
    "event": "task_success" | "task_failed";
    /**
     * @example "Scheduled task succeeded"
     * @example "Scheduled task failed"
     */
    "message": string;
    "task_name": string;
    "task_uuid": string;
    "output": string;
    /**
     * Included for application-level tasks. Service-level tasks send
     * `service_uuid` instead.
     */
    "application_uuid"?: string;
    /**
     * Included for service-level tasks. Application-level tasks send
     * `application_uuid` instead.
     */
    "service_uuid"?: string;
    /** Only present when available. */
    "url"?: string;
};

/**
 * Sent when a Docker cleanup job completes successfully.
 *
 * @example
 * ```json
 *  {
 *      "success": true,
 *      "event": "docker_cleanup_success",
 *      "message": "Docker cleanup job succeeded",
 *      "server_name": "...",
 *      "server_uuid": "...",
 *      "cleanup_message": "...",
 *      "url": "..."
 *  }
 * ```
 */
type DockerCleanupSuccessPayload = {
    "success": true;
    "event": "docker_cleanup_success";
    /** @example "Docker cleanup job succeeded" */
    "message": string;
    "server_name": string;
    "server_uuid": string;
    "cleanup_message": string;
    "url": string;
};

/**
 * Sent when a Docker cleanup job fails.
 *
 * @example
 * ```json
 *  {
 *      "success": false,
 *      "event": "docker_cleanup_failed",
 *      "message": "Docker cleanup job failed",
 *      "server_name": "...",
 *      "server_uuid": "...",
 *      "error_message": "...",
 *      "url": "..."
 *  }
 * ```
 */
type DockerCleanupFailedPayload = {
    "success": false;
    "event": "docker_cleanup_failed";
    /** @example "Docker cleanup job failed" */
    "message": string;
    "server_name": string;
    "server_uuid": string;
    "error_message": string;
    "url": string;
};

/**
 * Sent when a Docker cleanup job completes successfully or when it fails.
 */
export type DockerCleanupStatusPayload =
    | DockerCleanupSuccessPayload
    | DockerCleanupFailedPayload;

/**
 * Sent when a previously unreachable server becomes reachable again,
 * or when Coolify cannot reach a server
 *
 * @example
 * ```json
 * {
 *   "success": true,
 *   "event": "server_reachable",
 *   "message": "Server revived",
 *   "server_name": "...",
 *   "server_uuid": "...",
 *   "url": "..."
 * }
 * ```
 */
export type ServerConnectionStatusPayload = {
    "success": boolean;
    "event": "server_reachable" | "server_unreachable";
    /**
     * @example "Server revived"
     * @example "Server unreachable"
     */
    "message": string;
    "server_name": string;
    "server_uuid": string;
    "url": string;
};

/**
 * Sent when disk usage on a server exceeds the configured threshold.
 *
 * @example
 * ```json
 * {
 *   "success": false,
 *   "event": "high_disk_usage",
 *   "message": "High disk usage detected",
 *   "server_name": "...",
 *   "server_uuid": "...",
 *   "disk_usage": 85,
 *   "threshold": 80,
 *   "url": "..."
 * }
 * ```
 */
export type ServerDiskUsagePayload = {
    "success": false;
    "event": "high_disk_usage";
    /** @example "High disk usage detected" */
    "message": string;
    "server_name": string;
    "server_uuid": string;
    /**
     * Integer percentage.
     *
     * @example 85
     */
    "disk_usage": number;
    /**
     * Integer percentage.
     *
     * @example 80
     */
    "threshold": number;
    "url": string;
};

/**
 * Sent when available OS patches are detected on a server.
 *
 * @example
 * ```json
 * {
 *   "success": false,
 *   "event": "server_patch_check",
 *   "message": "Server patches available",
 *   "server_name": "...",
 *   "server_uuid": "...",
 *   "total_updates": 12,
 *   "os_id": "ubuntu",
 *   "package_manager": "apt",
 *   "updates": [],
 *   "critical_packages_count": 2,
 *   "url": "..."
 * }
 * ```
 */
type ServerPatchCheckPayload = {
    "success": false;
    "event": "server_patch_check";
    /** @example "Server patches available" */
    "message": string;
    "server_name": string;
    "server_uuid": string;
    /** @example 12 */
    "total_updates": number;
    /** @example "ubuntu" */
    "os_id": string;
    /** @example "apt" */
    "package_manager": string;
    "updates": unknown[];
    /** @example 2 */
    "critical_packages_count": number;
    "url": string;
};

/**
 * Sent when Coolify cannot complete the server patch check.
 *
 * @example
 * ```json
 * {
 *   "success": false,
 *   "event": "server_patch_check_error",
 *   "message": "Failed to check patches",
 *   "server_name": "...",
 *   "server_uuid": "...",
 *   "os_id": "ubuntu",
 *   "package_manager": "apt",
 *   "error": "...",
 *   "url": "..."
 * }
 * ```
 */
type ServerPatchCheckErrorPayload = {
    "success": false;
    "event": "server_patch_check_error";
    /** @example "Failed to check patches" */
    "message": string;
    "server_name": string;
    "server_uuid": string;
    /** @example "ubuntu" */
    "os_id": string;
    /** @example "apt" */
    "package_manager": string;
    "error": string;
    "url": string;
};

/**
 * Sent when available OS patches are detected on a server, or when Coolify
 * cannot complete the patch check.
 */
export type ServerPatchCheckStatusPayload =
    | ServerPatchCheckPayload
    | ServerPatchCheckErrorPayload;

/**
 * Sent when one or more servers are running an outdated version of the Traefik
 * proxy.
 *
 * @example
 * ```json
 * {
 *   "success": false,
 *   "event": "traefik_version_outdated",
 *   "message": "Traefik proxy outdated",
 *   "affected_servers_count": 1,
 *   "servers": [
 *     {
 *       "name": "...",
 *       "uuid": "...",
 *       "current_version": "v3.1.0",
 *       "latest_version": "v3.1.4",
 *       "update_type": "patch_update",
 *       "upgrade_target": "v3.2",
 *       "newer_branch_target": "...",
 *       "newer_branch_latest": "..."
 *     }
 *   ]
 * }
 * ```
 */
export type TraefikVersionOutdatedPayload = {
    "success": false;
    "event": "traefik_version_outdated";
    /** @example "Traefik proxy outdated" */
    "message": string;
    /** @example 1 */
    "affected_servers_count": number;
    "servers": {
        "name": string;
        "uuid": string;
        /** @example "v3.1.0" */
        "current_version": string;
        /** @example "v3.1.4" */
        "latest_version": string;
        "update_type": "patch_update" | "minor_upgrade";
        /**
         * Target minor version. Only present for `minor_upgrade`.
         *
         * @example "v3.2"
         */
        "upgrade_target"?: string;
        /** Present when a newer major/minor branch is available. */
        "newer_branch_target"?: string;
        /** Present when a newer major/minor branch is available. */
        "newer_branch_latest"?: string;
    }[];
};

/**
 * Sent when a container stops unexpectedly, i.e. not via a manual stop action
 * (`container_stopped`), or when Coolify restarts a container automatically
 * (`container_restarted`).
 *
 * @example
 * ```json
 * {
 *   "success": false,
 *   "event": "container_stopped",
 *   "message": "Resource stopped unexpectedly",
 *   "container_name": "...",
 *   "server_name": "...",
 *   "server_uuid": "...",
 *   "url": "..."
 * }
 * ```
 */
export type ContainerEventPayload = {
    "success": boolean;
    "event": "container_stopped" | "container_restarted";
    /**
     * @example "Resource stopped unexpectedly"
     * @example "Resource restarted automatically"
     */
    "message": string;
    "container_name": string;
    "server_name": string;
    "server_uuid": string;
    /** Only present when available. */
    "url"?: string;
};

/**
 * Sent when **Send Test Notification** is clicked in the Coolify dashboard.
 *
 * @example
 * ```json
 * {
 *   "success": true,
 *   "event": "test",
 *   "message": "This is a test webhook notification from Coolify.",
 *   "url": "..."
 * }
 * ```
 */
export type TestEventPayload = {
    "success": true;
    "event": "test";
    /** @example "This is a test webhook notification from Coolify." */
    "message": string;
    "url": string;
};

export type CoolifyWebhookPayload =
    | DeploymentStatusPayload
    | StatusChangePayload
    | RestartLimitReachedPayload
    | BackupStatusPayload
    | TaskStatusPayload
    | DockerCleanupStatusPayload
    | ServerConnectionStatusPayload
    | ServerDiskUsagePayload
    | ServerPatchCheckStatusPayload
    | TraefikVersionOutdatedPayload
    | ContainerEventPayload
    | TestEventPayload;

/**
 * Our view of a webhook body whose `event` is not part of
 * {@link CoolifyWebhookPayload}. Probably an event Coolify introduced after
 * this file was last updated.
 *
 * Unlike the types above, this does not describe a documented payload.
 * It only exists to read something usable out of an unknown event.
 *
 * @example a hypothetical unknown event, abbreviated to the fields we read
 * ```json
 * {
 *   "event": "deployment_cancelled",
 *   "message": "Deployment was cancelled",
 *   "url": "..."
 * }
 * ```
 */
export type UnknownCoolifyPayload = {
    "event"?: string;
    "message"?: string;
    "url"?: string;
};
