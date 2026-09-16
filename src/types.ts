// Sent when an application deployment completes successfully
// or sent when an application deployment fails.
export type DeploymenStatusPayload = {
    success: boolean;
    event: "deployment_success" | "deployment_failed";
    message: string; // Deployment failed
    application_name: string; // my-app"
    application_uuid: string;
    deployment_uuid: string;
    deployment_url: string;
    project: string;
    environment: string;
    fqdn: string;
};

// Sent when an application stops unexpectedly (not via a manual stop).
export type StatusChangePayload = {
    "success": false;
    "event": "status_changed";
    "message": string;
    "application_name": string;
    "application_uuid": string;
    "project": string;
    "environment": string;
    "fqdn": string;
    "url": string;
};

// Sent when Coolify stops an application after it reaches its automatic restart limit. This event uses the Container Status Changes notification selection.
export type RestartLimitReachedPayload = {
    "success": false;
    "event": "restart_limit_reached";
    "message": string;
    "application_name": string;
    "application_uuid": string;
    "restart_count": number;
    "max_restart_count": number;
    "url": string;
    "project": string;
    "environment": string;
    "fqdn": string;
};

export type BackupStatusPayload = {
    "success": boolean;
    "event": "backup_success" | "backup_failed" | "backup_success_with_s3_warning";
    "message": string;
    "database_name": string;
    "database_uuid": string;
    "database_type": string;
    "frequency": string;
    "error_output"?: string; // only available on "backup_failed"
    "s3_error"?: string; // s3_storage_url & s3_error is only present when the S3 storage URL is available.
    "s3_storage_url"?: string; // s3_storage_url & s3_error is only present when the S3 storage URL is available.
    "url": string;
};

export type TaskStatusPayload = {
    "success": boolean;
    "event": "task_success" | "task_failed";
    "message": string;
    "task_name": string;
    "task_uuid": string;
    "output": string;
    "application_uuid": string; // application_uuid is included for application-level tasks. For service-level tasks,
    "service_uuid": string; // service_uuid is included instead
    "url"?: string; // url is only present when available
};

export type DockerCleanupStatusPayload = {
    "success": boolean;
    "event": "docker_cleanup_success" | "docker_cleanup_failed";
    "message": string;
    "server_name": string;
    "server_uuid": string;
    "cleanup_message": string;
    "url": string;
};

export type ServerConnectionStatusPayload = {
    "success": boolean;
    "event": "server_reachable" | "server_unreachable";
    "message": string;
    "server_name": string;
    "server_uuid": string;
    "url": string;
};

export type ServerDiskUsagePayload = {
    "success": false;
    "event": "high_disk_usage";
    "message": string;
    "server_name": string;
    "server_uuid": string;
    "disk_usage": number;
    "threshold": number;
    "url": string;
};

export type ServerPatchCheckStatus = {
    "success": false;
    "event": "server_patch_check" | "server_patch_check_error";
    "message": string;
    "server_name": string;
    "server_uuid": string;
    "total_updates": number;
    "os_id": string;
    "package_manager": string;
    "updates": Array<unknown>;
    "critical_packages_count": number;
    "url": string;
};

export type TraefikVersionOutdatedPayload = {
    "success": false;
    "event": "traefik_version_outdated";
    "message": string;
    "affected_servers_count": number;
    "servers": [
        {
            "name": string;
            "uuid": string;
            "current_version": string;
            "latest_version": string;
            "update_type": "patch_update" | "minor_upgrade";
            "upgrade_target"?: string; // Target minor version — only present for minor_upgrade
            "newer_branch_target"?: string; // Present when a newer major/minor branch is available
            "newer_branch_latest"?: string; // Present when a newer major/minor branch is available
        },
    ];
};

export type ContainerEventPayload = {
    "success": boolean;
    "event": "container_stopped" | "container_restarted";
    "message": string;
    "container_name": string;
    "server_name": string;
    "server_uuid": string;
    "url"?: string; // url is only present when available
};

export type TestEventPayload = {
    "success": true;
    "event": string;
    "message": string;
    "url": string;
};
