# Courier

A small HTTP relay that receives **Coolify webhooks** and forwards them as
authenticated messages to a self-hosted **[ntfy](https://ntfy.sh)** service.

## Why?

Coolify can only send notifications to a plain **URL** without any auth header.
A self-hosted ntfy, however, may require authentication. As a result, Coolify
cannot publish to ntfy directly.

Courier bridges that gap: the caller authenticates via a **query parameter**
(`?token=…`). Courier verifies the token, maps the Coolify payload into an ntfy
message, and publishes it using the real ntfy credentials.

## Setup

Requires Node.js ≥ 18.

```bash
npm install
```

Create a `.env` in the project root (see [Configuration](#configuration)):

```env
RELAY_TOKEN="your-shared-secret"
NTFY_URL="https://ntfy.example.com"
NTFY_USERNAME="user"
NTFY_PASSWORD="pass"
```

Development with hot-reload via `tsx watch`:

```bash
npm run dev
```

The server then runs on <http://localhost:3000>.

Production:

```bash
npm run build   # compiles to dist/
npm start       # node dist/index.js
```

## Configuration

Environment variables are read and validated at startup, if a required variable
is missing, the process aborts with an error.

| Variable              | Required | Description                                                                |
| --------------------- | -------- | -------------------------------------------------------------------------- |
| `PORT`                | no       | Port the application runs on (default: `3000`)                             |
| `RELAY_TOKEN`         | yes      | Shared secret; checked against `?token=`. At least 32 characters           |
| `RATELIMIT_WHITELIST` | no       | A comma-separated string of IP addresses whitelisted from the rate limiter |
| `NTFY_URL`            | yes      | Base URL of the ntfy server, e.g. `https://ntfy.foo`                       |
| `NTFY_USERNAME`       | yes\*    | Username for ntfy basic auth                                               |
| `NTFY_PASSWORD`       | yes\*    | Password for ntfy basic auth                                               |
| `NTFY_TOKEN`          | yes\*    | Access token for ntfy, sent as a bearer token                              |

\* You must set either `NTFY_USERNAME` **and** `NTFY_PASSWORD`, or `NTFY_TOKEN`.
If both are configured, the token wins and basic auth is ignored.

All requests are rate limited to 100 per 15 minutes per IP, except for the
addresses in `RATELIMIT_WHITELIST`.

## Endpoints

| Method | Path                          | Purpose                            |
| ------ | ----------------------------- | ---------------------------------- |
| `POST` | `/ntfy/:source/:topic?token=` | Accept & forward a webhook to ntfy |
| `GET`  | `/health`                     | Liveness check, always `200`       |

- `:source`: the system the payload comes from. Currently only `coolify`.
- `:topic`: the ntfy topic to publish to
- `?token=`: must match `RELAY_TOKEN`

The Coolify webhook URL then looks like this:

```text
https://relay.example.com/ntfy/coolify/deploys?token=SECRET
```

### Responses

| Status | Meaning                                                          |
| ------ | ---------------------------------------------------------------- |
| `204`  | Successfully forwarded to ntfy                                   |
| `400`  | Body is not valid JSON or not an object, or `:source` is unknown |
| `401`  | `token` missing or incorrect                                     |
| `429`  | Rate limit exceeded                                              |
| `500`  | Unexpected error while forwarding                                |
| `502`  | ntfy responded non-2xx, or a network error occurred              |

### Coolify to ntfy mapping

Each webhook is formatted into an internal `Notification` (`title`, `message`,
`severity`, optional `url`), which the ntfy notifier then publishes:

| `Notification` | ntfy field | Note                                            |
| -------------- | ---------- | ----------------------------------------------- |
| `title`        | `title`    | Event plus the affected resource                |
| `message`      | `message`  | Coolify's `message`, sometimes extended         |
| `severity`     | `priority` | `info` => `2`, `warning` => `4`, `error` => `5` |
| `url`          | `click`    | Omitted when the payload carries no URL         |

Events that carry free-form output (backup stderr, task output, cleanup logs)
append it to the message, truncated to the **last** 500 characters. A truncated
detail is prefixed with `[...]`.

### Handled events

All 20 documented Coolify event types are mapped:

| Event                            | Severity  | Message extended with      |
| -------------------------------- | --------- | -------------------------- |
| `deployment_success`             | `info`    | –                          |
| `deployment_failed`              | `error`   | –                          |
| `status_changed`                 | `error`   | –                          |
| `restart_limit_reached`          | `error`   | Restart count and limit    |
| `backup_success`                 | `info`    | –                          |
| `backup_failed`                  | `error`   | `error_output`             |
| `backup_success_with_s3_warning` | `warning` | `s3_error`                 |
| `task_success`                   | `info`    | `output`                   |
| `task_failed`                    | `error`   | `output`                   |
| `docker_cleanup_success`         | `info`    | `cleanup_message`          |
| `docker_cleanup_failed`          | `error`   | `error_message`            |
| `server_reachable`               | `info`    | –                          |
| `server_unreachable`             | `error`   | –                          |
| `high_disk_usage`                | `warning` | Usage and threshold        |
| `server_patch_check`             | `info`    | Update and critical counts |
| `server_patch_check_error`       | `error`   | `error`                    |
| `traefik_version_outdated`       | `warning` | Per-server version list    |
| `container_stopped`              | `error`   | –                          |
| `container_restarted`            | `warning` | –                          |
| `test`                           | `info`    | –                          |

An event Coolify introduces later still gets through: it is published as
`Unhandled Coolify event: <event>` with `warning` severity.

## Security

The token is passed as a **query parameter** (`?token=…`) because Coolify can only
call a plain URL, it cannot send an `Authorization` header. Passing secrets in the
query string is normally discouraged, but the usual reasons (browser `Referer`
leakage, history, bookmarks) **do not apply here**: this is a server-to-server
`POST`, with no browser involved.

That leaves one relevant residual risk and a few hardening steps:

- **Always run behind TLS.** Under HTTPS the query string is part of the encrypted
  request. Just like a header, the token is **not** exposed on the wire. So always ensure you send your requests with HTTPS.
- **Keep the token out of logs.** The only real leak path is access logs at each
  hop (the reverse proxy in front of Courier, e.g. Traefik in a Coolify setup).
  Configure the proxy to drop or redact the `token` query parameter, and avoid
  logging full request URLs in Courier itself.
- **Use a long, random token.** Generate at least 256 bits of entropy:

  ```bash
  # any one of these
  openssl rand -hex 32
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- **Limited blast radius.** A leaked token only lets an attacker publish ntfy
  notifications to your topics (i.e. send you spam). The real ntfy credentials stay
  server-side and are never exposed to the caller.

### Rotating the token

The token lives in a single env var, so rotation is quick:

1. Generate a new secret, e.g. with `openssl rand -hex 32` or `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
2. Update `RELAY_TOKEN` in your `.env`.
3. Update the `?token=` value in the Coolify webhook notification URL.
4. Restart Courier so the new value is picked up.

## Testing

```bash
# Simulate a failed deployment
curl -X POST "http://localhost:3000/ntfy/coolify/deploys?token=SECRET" \
  -H "Content-Type: application/json" \
  -d '{
        "success": false,
        "event": "deployment_failed",
        "message": "Deployment failed",
        "application_name": "my-app",
        "application_uuid": "abc123",
        "deployment_uuid": "def456",
        "deployment_url": "https://coolify.example.com/deployment/def456",
        "project": "my-project",
        "environment": "production",
        "fqdn": "https://my-app.example.com"
      }'
# -> 204, "Deployment failed: my-app (production)" appears in the topic "deploys"

# Unknown source
curl -X POST "http://localhost:3000/ntfy/github/deploys?token=SECRET" \
  -H "Content-Type: application/json" -d '{"event":"test"}'
# -> 400

# Wrong token
curl -X POST "http://localhost:3000/ntfy/coolify/deploys?token=wrong" \
  -H "Content-Type: application/json" -d '{}'
# -> 401
```

To test for real: create a webhook notification in Coolify using the URL above and
click "Send test notification".

## Project structure

The layout follows the two axes the relay spans: the **source** a payload comes
from (formatters) and the **target** it is published to (notifiers).

| File                         | Purpose                                                |
| ---------------------------- | ------------------------------------------------------ |
| `src/index.ts`               | Server bootstrap (`@hono/node-server`)                 |
| `src/app.ts`                 | Hono app: rate limiter, mounts `/ntfy` and `/health`   |
| `src/env.ts`                 | Load & validate env, export typed `env` object         |
| `src/lib/utils.ts`           | `isAuthorized()` timing-safe compare, `truncateTail()` |
| `src/routes/ntfy.ts`         | HTTP layer only: auth, body, status codes              |
| `src/routes/health.ts`       | Liveness endpoint                                      |
| `src/formatters/registry.ts` | Maps the `:source` path segment to a formatter         |
| `src/formatters/coolify/*`   | Coolify payload types and the event formatter          |
| `src/notifiers/ntfy.ts`      | ntfy transport: auth, JSON body, POST                  |
| `src/notifiers/types.ts`     | `Notification` and `NotifyResult` shapes               |

## Stack

- [Hono](https://hono.dev)
- TypeScript

## Roadmap

- Tags/emoji per severity
- Dockerfile for container deployment
- Test suite with [Vitest](https://vitest.dev)
