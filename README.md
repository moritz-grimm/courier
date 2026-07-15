# Courier

A small HTTP relay that receives **Coolify webhooks** and forwards them as
authenticated messages to a self-hosted **[ntfy](https://ntfy.sh)** service.

## Why?

Coolify can only send notifications to a plain **URL** without any auth header. A self-hosted ntfy, however, may requires authentication. As a
result, Coolify cannot publish to ntfy directly.

Courier bridges that gap: the caller authenticates via a **query parameter**
(`?token=…`). Courier verifies the token, maps the Coolify payload into an ntfy message, and publishes it using the real ntfy credentials.

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
| `PORT`                | no       | Port the application runs on   (default: `3000`)                           |
| `RELAY_TOKEN`         | yes      | Shared secret; checked against `?token=`                                   |
| `RATELIMIT_WHITELIST` | no       | A comma-separated string of IP addresses whitelisted from the rate limiter |
| `NTFY_URL`            | yes      | Base URL of the ntfy server, e.g. `https://ntfy.foo`                       |
| `NTFY_USERNAME`       | yes\*    | Username for ntfy basic auth                                               |
| `NTFY_PASSWORD`       | yes\*    | Password for ntfy basic auth                                               |
| `NTFY_TOKEN`          | –        | Bearer token for ntfy (not implemented yet)                                |

\* You must set either `NTFY_USERNAME` **and** `NTFY_PASSWORD`, or `NTFY_TOKEN`.
Currently only the **basic-auth path** is implemented; if only `NTFY_TOKEN` is set,
the relay responds with `501 Not Implemented`.

## Endpoint

| Method | Path                          | Purpose                          |
| ------ | ----------------------------- | -------------------------------- |
| `POST` | `/ntfy/coolify/:topic?token=` | Accept & forward Coolify webhook |

- `:topic`: the ntfy topic to publish to
- `?token=`: must match `RELAY_TOKEN`

The Coolify webhook URL then looks like this:

```text
https://relay.example.com/ntfy/coolify/deploys?token=SECRET
```

### Responses

| Status | Meaning                                                   |
| ------ | --------------------------------------------------------- |
| `204`  | Successfully forwarded to ntfy                            |
| `400`  | Body is not valid JSON                                    |
| `401`  | `token` missing or incorrect                              |
| `501`  | Only `NTFY_TOKEN` set (bearer branch not yet implemented) |
| `502`  | ntfy responded non-2xx, or a network error occurred       |

### Coolify to ntfy mapping

The ntfy JSON body is derived from the Coolify payload:

- **`topic`**: from the path parameter.
- **`title`**: from `event`.
- **`message`**: `message` plus the `applicationName` and `deploymentUrl` for context.

> This mapping is still very basic: it does not yet distinguish `success` from
> failure, nor the different event types (deployment, backup, …). See the
> [Roadmap](#roadmap).

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

1. Generate a new secret:
2. Update `RELAY_TOKEN` in your `.env`.
3. Update the `?token=` value in the Coolify webhook notification URL.
4. Restart Courier so the new value is picked up:

## Testing

```bash
# Simulate a successful deployment
curl -X POST "http://localhost:3000/ntfy/coolify/deploys?token=SECRET" \
  -H "Content-Type: application/json" \
  -d '{
        "success": true,
        "event": "deployment_success",
        "message": "New version successfully deployed",
        "applicationName": "my-app",
        "deploymentUrl": "https://my-app.example.com"
      }'
# -> 204, message appears in the ntfy topic "deploys"

# Wrong token
curl -X POST "http://localhost:3000/ntfy/coolify/deploys?token=wrong" \
  -H "Content-Type: application/json" -d '{}'
# -> 401
```

To test for real: create a webhook notification in Coolify using the URL above and
click "Send test notification".

## Project structure

| File            | Purpose                                                    |
| --------------- | ---------------------------------------------------------- |
| `src/index.ts`  | Server bootstrap (`@hono/node-server`, port 3000)          |
| `src/app.ts`    | Hono app, mounts the ntfy router under `/ntfy/coolify`     |
| `src/ntfy.ts`   | Webhook handler: auth check, payload mapping, POST to ntfy |
| `src/config.ts` | Load & validate env, export typed `config` object          |
| `src/utils.ts`  | `isAuthorized()` — timing-safe token comparison            |

## Stack

- [Hono](https://hono.dev)
- TypeScript

## Roadmap

- Bearer-token auth for ntfy (`NTFY_TOKEN` branch)
- Distinguish `success` from failure in the message (priority, tags/emoji)
- Handle the different Coolify event types (deployment, backup, …) with tailored messages
- Rich mapping: derive priority, tags/emoji, and click URL from Coolify fields
- `/health` endpoint for liveness checks
- Dockerfile for container deployment
- Entropy check for `RELAY_TOKEN` at startup (reject short/weak secrets, fail fast)
- Test suite with [Vitest](https://vitest.dev)
