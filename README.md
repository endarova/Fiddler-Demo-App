# Trip Planner — Fiddler Everywhere demo app

A small web app that loads a 3-day forecast from **SkyCast**, an external weather API. The app was "built by an AI coding agent", and it has one bug: the `Authorization` header is sent without the `Bearer` scheme, so SkyCast returns **401 Unauthorized**. The UI only shows a generic error.

SkyCast runs locally as a mock ([mock-api/skycast.js](mock-api/skycast.js)) so the demo is deterministic and uses no real credentials. In the story, treat it as a third-party service whose code and logs you can't see.

## Requirements

- Node.js 20.6 or later. No `npm install` step is needed because the app has no dependencies.
- Fiddler Everywhere listening on its default port, `8866`.

## Run

```bash
# Terminal 1: the "third-party" API (keep this terminal off-screen)
npm run api

# Terminal 2: the app, with outbound calls routed through Fiddler
npm run app:fiddler      # or `npm run app` to run without Fiddler

open http://localhost:3000
```

## Layout

| Path | Purpose |
| --- | --- |
| [server/skycast-client.js](server/skycast-client.js) | AI-generated API client. **The bug is here.** |
| [server/index.js](server/index.js) | Serves the UI and `/api/forecast`, and hides the upstream error behind a generic 502 |
| [server/http.js](server/http.js) | Small HTTP helper that honors `HTTP_PROXY` so Fiddler can capture server-side calls |
| [public/](public) | Front end |
| [mock-api/skycast.js](mock-api/skycast.js) | SkyCast mock. It requires `Authorization: Bearer <key>` |

## Branches

- `main`: the broken version used for recording.
- `solution`: the one-line fix, if you need a backup.

To reset between takes, run `git checkout -- server/skycast-client.js`.

See [RECORDING-GUIDE.md](RECORDING-GUIDE.md) for the step-by-step recording script.
