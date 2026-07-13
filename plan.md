# Courier – Coolify → ntfy Relay Agent (v1)

## Context

Coolify kann Notifications nur an eine reine **URL** schicken (kein Auth-Header,
keine Custom-Header, kein Secret). Der self-hosted **ntfy**-Dienst verlangt aber
Authentifizierung (`Authorization: Bearer …`). Dadurch kann Coolify nicht direkt
an ntfy publishen.

**Courier** schließt diese Lücke: ein kleiner HTTP-Relay, den Coolify per Webhook
aufruft. Courier authentifiziert den Aufrufer über einen **Query-Parameter**
(`?token=…`, das Einzige was Coolify in eine Webhook-URL packen kann), formt die
Coolify-Payload in eine ntfy-Nachricht um und publisht sie mit dem echten
ntfy-Bearer-Token an ntfy.

```text
Coolify  --POST /notify/:topic?token=SECRET-->  Courier  --POST + Bearer-->  ntfy
```

Basis ist das vorhandene, praktisch leere Hono/Node/TypeScript-Scaffold
(`src/app.ts`, `src/index.ts`).

## Design-Entscheidungen (bestätigt)

- **Topic** kommt aus dem **URL-Pfad**: `POST /notify/:topic`
- **Rich Mapping**: Title, Priority, Tags/Emoji und Click-URL werden aus den
  Coolify-Feldern abgeleitet
- **Nur App**, kein Dockerfile in v1

## Endpunkte

| Methode | Pfad                    | Zweck                                   |
| ------- | ----------------------- | --------------------------------------- |
| `POST`  | `/notify/:topic?token=` | Coolify-Webhook annehmen & weiterleiten |
| `GET`   | `/health`               | Liveness-Check (kein Auth)              |

Coolify-Webhook-URL sieht dann so aus:
`https://relay.example.com/notify/deploys?token=SECRET`

## Konfiguration (Environment-Variablen)

Beim Start einlesen und validieren (fehlt eine → sofort mit Fehler abbrechen):

| Variable      | Pflicht | Beschreibung                                        |
| ------------- | ------- | --------------------------------------------------- |
| `RELAY_TOKEN` | ja      | Shared Secret; wird gegen `?token=` geprüft         |
| `NTFY_URL`    | ja      | Base-URL des ntfy-Servers, z. B. `https://ntfy.foo` |
| `NTFY_TOKEN`  | ja      | Bearer-Token für ntfy                               |
| `PORT`        | nein    | Default `3000` (bereits in `index.ts` hartkodiert)  |

## Dateistruktur (neu)

- `src/config.ts` – Env laden & validieren, typisiertes `config`-Objekt exportieren.
- `src/coolify.ts` – TypeScript-Typen für die Coolify-Payload + defensiver Parser
  (`success`, `event`, `message` + optionale Felder wie `application_name`,
  `database_name`, `deployment_url`, `fqdn`, …).
- `src/ntfy.ts` – `buildNtfyMessage(payload, topic)` (Mapping-Logik) +
  `publish(msg)` (POST an ntfy via natives `fetch`, Bearer-Header).
- `src/app.ts` – Hono-Routen `/health` und `/notify/:topic` inkl. Token-Check.
- `src/index.ts` – bleibt weitgehend; `PORT` aus `config` statt hartkodiert.

## Auth (Query-Parameter)

Im `/notify`-Handler: `c.req.query("token")` gegen `config.relayToken` prüfen.
Vergleich **timing-safe** via `crypto.timingSafeEqual` (Längen vorher vergleichen,
sonst wirft es). Fehlend/falsch → `401`. Kein Token wird geloggt.

## Mapping Coolify → ntfy (Rich)

`buildNtfyMessage(payload, topic)` erzeugt den ntfy-JSON-Body:

- **`topic`**: aus Pfad-Param.
- **`message`**: `payload.message` (Fallback: `payload.event`).
- **`title`**: humanisiertes Event + Entitätsname, z. B.
  `Deployment failed – my-app`. Name aus erstem vorhandenen Feld
  (`application_name` → `database_name` → `server_name` → sonst weglassen).
- **`priority`**:
  - `success === false` → `4` (high)
  - kritische Events (`server_unreachable`, `high_disk_usage`) → `5` (max)
  - sonst → `3` (default)
  - (kleine Severity-Map im Code, mit Defaults wie oben)
- **`tags`** (Emoji): failure → `rotating_light`; success → `white_check_mark`;
  backup-Events → zusätzlich `floppy_disk`; server-Events → `desktop_computer`.
- **`click`**: `deployment_url` ?? `fqdn` (nur setzen wenn vorhanden).
- **`markdown`**: `false` (Coolify-`message` ist Klartext).

ntfy-Request: `POST ${NTFY_URL}` mit
`Authorization: Bearer ${NTFY_TOKEN}`, `Content-Type: application/json`
und obigem Body.

## Fehlerbehandlung & Antworten

- Token fehlt/falsch → `401`.
- Body ist kein JSON-Objekt → `400` (Coolify sendet immer JSON; defensiv prüfen).
- ntfy antwortet non-2xx **oder** Netzwerkfehler → `502`, mit geloggtem Grund
  (Status/Body von ntfy). Token niemals loggen.
- Erfolg → `204 No Content`.
- Coolify `test`-Event (Validierungs-Ping beim Einrichten) läuft durch den
  normalen Pfad und wird an ntfy weitergereicht.

## Reuse / Konventionen

- Vorhandenes **Hono** + `@hono/node-server` weiterverwenden (schon Dependencies).
- **Natives `fetch`** (Node ≥ 18) für den ntfy-Call – keine neue Dependency.
- `crypto` aus Node-Standardlib für den timing-safe Token-Vergleich.
- ESLint-Config (`@moritz-grimm/eslint-config`) & bestehender TS-Strict-Mode gelten.

## Verifikation (End-to-End)

1. `.env`/Env setzen (`RELAY_TOKEN`, `NTFY_URL`, `NTFY_TOKEN`), `npm run dev`.
2. **Health**: `curl http://localhost:3000/health` → `200`.
3. **Auth negativ**: `POST /notify/test` ohne/mit falschem `token` → `401`.
4. **Deployment-Erfolg** simulieren:
   ```text
   curl -X POST "http://localhost:3000/notify/deploys?token=SECRET" \
     -H "Content-Type: application/json" \
     -d '{"success":true,"event":"deployment_success",
          "message":"New version successfully deployed",
          "application_name":"my-app","fqdn":"https://my-app.example.com"}'
   ```
   → `204`; in ntfy erscheint Nachricht mit Title `Deployment succeeded – my-app`,
   priority 3, Tag ✅, Click = fqdn.
5. **Failure** (`success:false`, `event:"deployment_failed"`) → priority 4, Tag 🚨.
6. **ntfy-Fehler**: falsches `NTFY_TOKEN` → Relay antwortet `502`, Log zeigt den
   ntfy-Statuscode.
7. Echt testen: in Coolify eine Webhook-Notification mit obiger URL anlegen und
   den „Send test notification“-Button klicken → Nachricht landet in ntfy.

## Optional / später (nicht in v1)

- Dockerfile + `.dockerignore` für Container-Deployment auf Coolify.
- Pro-Topic-Tokens statt eines Shared Secrets.
- Retry/Backoff bei ntfy-5xx.
